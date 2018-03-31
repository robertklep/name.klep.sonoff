const { EventEmitter }                  = require('events');
const Queue                             = require('promise-fifo').use(Promise);
const assert                            = require('assert');
const { deferred, delay, isObject, lc } = require('./utils');
const { ANY_DEVICE }                    = require('./constants');

module.exports = class Device extends EventEmitter {

  constructor(name, client) {
    super();
    this.name         = name === ANY_DEVICE ? 'ANY_DEVICE' : name;
    this.topic        = name === ANY_DEVICE ? null : name;
    this.client       = client;
    this.capabilities = {};
    this.pendingQueue = [];
    this.messageQueue = new Queue();
    this.info         = {};
    this.isOnline     = false;
    this.debug        = require('debug')('sonoff-tasmota-mqtt:device:' + this.name);
  }

  async wait(retryInterval = 1000) {
    // Wait for device to come online.
    while (true) {
      try {
        return await this.getStatus(5000);
      } catch(e) {
        if (e.message !== 'TIMEOUT') throw e;
      }
      this.debug('waiting for device to come online');
      await delay(retryInterval);
    }
  }

  onMessage(command, payload) {
    this.debug('received command', command, payload);

    // Try to resolve any pending commands.
    let idx = this.pendingQueue.findIndex(pending => pending.command === lc(command));
    if (idx !== -1) {
      let entry = this.pendingQueue[idx];

      // Reject if the command wasn't recognized.
      if (isObject(payload) && payload.Command === 'Unknown') {
        this.pendingQueue.splice(idx, 1);
        return entry.reject(Error('UNKNOWN_COMMAND'));
      }

      // Resolve the entire payload by default.
      let toResolve = payload;

      // If we're expecting a specific property in the response, try to find it.
      if (entry.property && isObject(payload)) {
        toResolve = null;
        for (let key in payload) {
          if (lc(key) === entry.property) {
            toResolve = payload[key];
            break;
          }
        }
      }

      // Message matches a pending request.
      if (toResolve !== null) {
        this.pendingQueue.splice(idx, 1);
        return entry.resolve(toResolve);
      }
    }

    // Handle Last Will And Testament.
    if (command === 'LWT') {
      this.isOnline = payload !== 'Offline';
      return this.emit(this.isOnline ? 'online' : 'offline');
    }

    // Store INFO data.
    if (command.startsWith('INFO')) {
      this.info = Object.assign(this.info, payload);
      return;
    }

    // Queue the message.
    this.messageQueue.put({ command : lc(command), payload });
  }

  getName() {
    return this.name;
  }

  getTopic() {
    return this.topic;
  }

  setTopic(topic) {
    this.topic = topic;
  }


  nextMessage() {
    return this.messageQueue.get();
  }

  sendCommand(command, payload) {
    assert(this.topic, 'Unable to send due to missing topic');
    let topic = `cmnd/${ this.topic }/${ command }`;
    this.debug(topic, '→', payload);
    this.client.publish(topic, payload);
    return this;
  }

  waitFor(expect, timeout = null) {
    let defer = deferred();
    let [ command, property ] = lc(expect).split('.');
    let id = Date.now();
    this.pendingQueue.push({
      id,
      command,
      property,
      resolve : defer.resolve,
      reject  : defer.reject
    });
    if (timeout) {
      setTimeout(() => {
        // Remove entry from pending queue.
        let idx = this.pendingQueue.findIndex(p => p.id === id);
        if (idx !== -1) {
          this.pendingQueue.splice(idx, 1);
        }
        // Reject.
        defer.reject(Error('TIMEOUT'));
      }, timeout);
    }
    return defer.promise;
  }

  async getStatus(timeout = null) {
    return await this.sendCommand('status').waitFor('status.status', timeout);
  }

  async getState(timeout = null) {
    return await this.sendCommand('state').waitFor('result', timeout);
  }

  async setPowerState(state, timeout = null) {
    return await this.sendCommand('power', state === null ? '' : state ? '1' : '0').waitFor('result.power', timeout);
  }

  async powerOn(timeout = null) {
    return await this.setPowerState(true, timeout);
  }

  async powerOff(timeout = null) {
    return await this.setPowerState(false, timeout);
  }

  async rfReceive(timeout = null) {
    return await this.waitFor('result.RfReceived', timeout);
  }

  async hasSupport(cap, fn) {
    // Cached value (device capabilities can't change).
    if (cap in this.capabilities) return this.capabilities[cap];

    // Check the device to see if it has this particular support.
    try {
      await fn();
      this.capabilities[cap] = true;
    } catch(e) {
      if (e.message !== 'UNKNOWN_COMMAND') throw e;
      this.capabilities[cap] = false;
    }
    return this.capabilities[cap];
  }

  async hasPowerSupport(timeout = null) {
    return this.hasSupport('power', () => this.setPowerState(null, timeout));
  }

  async hasRfSupport(timeout = null) {
    return this.hasSupport('rf', () => this.sendCommand('rfcode').waitFor('result.rfcode', timeout));
  }

  async hasPowerMonitorSupport(timeout = null) {
    return this.hasSupport('powermonitor', () => this.sendCommand('powercal').waitFor('result', timeout));
  }

  async hasColorSupport(timeout = null) {
    return this.hasSupport('color', () => this.sendCommand('color').waitFor('result', timeout));
  }

  async hasColorTemperatureSupport(timeout = null) {
    return this.hasSupport('colortemp', () => this.sendCommand('ct').waitFor('result', timeout));
  }

  async hasDimmerSupport(timeout = null) {
    return this.hasSupport('dimmer', () => this.sendCommand('dimmer').waitFor('result', timeout));
  }

  async getSensors(timeout = null) {
    let sensors = await this.sendCommand('gpio').waitFor('result');
    return Object .keys(sensors)
                  .map(key => sensors[key].match(/\((.*?)\)/)[1])
                  .reduce((acc, value) => {
                    if (value !== 'None' && ! acc.includes(value)) {
                      acc.push(value);
                    }
                    return acc;
                  }, []);
  }

  end() {
    // Cleanup.
    this.removeAllListeners();
    this.client.unregisterDevice(this);
  }
}
