const { EventEmitter }    = require('events');
const mqtt                = require('mqtt');
const Device              = require('./device');
const { deferred, delay } = require('./utils');
const { ANY_DEVICE }      = require('./constants');
const assert              = require('assert');
const assertNotEnded      = value => assert(value, 'client has already ended');

module.exports = class SonoffTasmotaMqtt extends EventEmitter {

  constructor(host, opts) {
    super();
    if (typeof host !== 'string') throw Error('missing `host` argument');
    this.opts = Object.assign({
      host        : host,
      port        : 1883,
      username    : undefined,
      password    : undefined,
      mqttOptions : {},
    }, opts);
    this.debug    = require('debug')('sonoff-tasmota-mqtt:client');
    this.isOnline = false;
    this.hasEnded = false;
    this.backlog  = [];
    this.devices  = {};
  }

  async connect({ retry = true, retries = null, retryInterval = 5000 } = {}) {
    let initialRetries = retries;
    while (true) {
      try {
        this.client = await this._connect();
        this.setOnline(true);
        this.hasEnded = false;

        // handle disconnects.
        this.client.on('offline', async () => {
          this.debug('connection lost, will retry...');
          this.end();
          await delay(retryInterval);
          await this.connect({ retry, initialRetries, retryInterval });
        });

        // Start message loop.
        return this.messageLoop();
      } catch(e) {
        if (e.message !== 'CONNECTION_FAILED' || ! retry) {
          throw e;
        }
        // Retry.
        if (retry) {
          if (retries !== null && --retries <= 0) {
            throw e;
          }
          this.debug('retrying MQTT broker' + (retries === null ? '' : `, ${ retries } retries left`));
          await delay(retryInterval);
        }
      }
    }
  }

  _connect() {
    let defer  = deferred();
    let client = mqtt.connect({
      host     : this.opts.host,
      port     : this.opts.port,
      username : this.opts.username,
      password : this.opts.password,
      ...this.opts.mqttOptions
    }).once('connect', () => {
      this.debug(`connected to ${ this.opts.host }:${ this.opts.port }`);
      defer.resolve(client)
    }).once('error', err => {
      client.end();
      defer.reject(err);
    }).once('offline', () => {
      client.end();
      defer.reject(Error('CONNECTION_FAILED'));
    });
    return defer.promise;
  }

  setOnline(isOnline) {
    assertNotEnded(! this.hasEnded);
    this.isOnline = isOnline;

    // Flush backlog when coming online.
    if (isOnline && this.backlog.length) {
      this.debug('flushing backlog of', this.backlog.length, 'items');
      this.backlog.forEach(({ topic, payload }) => this.publish(topic, payload));
      this.backlog.length = 0;
    }
    this.emit(isOnline ? 'online' : 'offline');
  }

  messageLoop() {
    assertNotEnded(! this.hasEnded);
    this.client.subscribe('tele/+/+');
    this.client.subscribe('stat/+/+');
    this.client.on('message', this.onMessage.bind(this));
    return this;
  }

  onMessage(topic, message) {
    let [ type, deviceName, command ] = topic.split('/');

    // Check if we know for which device this message is.
    let device = this.devices[deviceName] || this.devices[ANY_DEVICE];
    if (! device) return;

    // Update the device's topic (typically this is already set, but for
    // ANY_DEVICE it may not have been set yet).
    device.setTopic(deviceName);

    // Try to parse message as JSON. If it fails, assume it's just a string.
    try {
      var payload = JSON.parse(message);
    } catch(e) {
      var payload = message.toString();
    }

    // Relay to device.
    device.onMessage(command, payload);
  }

  publish(topic, payload = '') {
    assertNotEnded(! this.hasEnded);
    if (this.isOnline) {
      return this.client.publish(topic, payload);
    }
    this.backlog.push({ topic, payload });
  }

  registerDevice(name) {
    this.devices[name] = this.devices[name] || new Device(name, this);
    return this.devices[name];
  }

  unregisterDevice(name) {
    delete this.devices[name];
  }

  // Register an "any" device, which represents any device that is not
  // already registered specifically (think "catch-all").
  registerAnyDevice() {
    return this.registerDevice(ANY_DEVICE);
  }

  unregisterAnyDevice() {
    delete this.unregisterDevice(ANY_DEVICE);
  }

  end() {
    this.setOnline(false);
    this.hasEnded = true;
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}
