const Homey     = require('homey');
const mqtt      = require('./mqtt');
const { delay } = require('./utils');

module.exports = class SonoffTasmotaDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, id = ${ this.getId() }, module type = ${ this.getModule() }, version = ${ this.getVersion() }, topic = ${ this.getTopic() }`);

    // "Wait For" queue.
    this.waitForQueue = [];

    // Register a capability listener.
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

    // Connect to broker.
    this.setUnavailable(Homey.__('mqtt.waiting'));
    await this.connect();
  }

  getId() {
    return this.getData().id;
  }

  getModule() {
    return this.getStore().module;
  }

  getVersion() {
    return this.getStore().version;
  }

  getTopic() {
    return this.getSettings().topic;
  }

  async connect() {
    const { mqttHost, mqttPort, mqttUser, mqttPassword } = this.getSettings();
    try {
      this.client = await mqtt.connect(mqttHost, mqttPort, mqttUser, mqttPassword);
      this.log(`connected to MQTT broker @ ${ mqttHost }:${ mqttPort }`);
    } catch(e) {
      this.log(`error connecting to MQTT broker @ ${ mqttHost }:${ mqttPort }:`, e.message);
      if (e.message === 'CONNECTION_FAILED') {
        return delay(5000).then(() => {
          this.log('retrying MQTT broker...');
          return this.connect();
        });
      }
      this.setUnavailable(Homey.__('mqtt.connection_error'));
    }

    // Handle MQTT broker going offline.
    this.client.on('offline', async () => {
      this.client.end();
      this.log('MQTT broker connection lost...');
      this.setUnavailable(Homey.__('mqtt.connection_lost'));
      await delay(1000);
      await this.connect();
    });

    // Still waiting for device.
    this.setUnavailable(Homey.__('device.waiting'));

    // Subscribe to `tele` and `stat` topics for this particular device, and
    // wait for messages.
    let topic = this.getTopic();
    this.client.subscribe(`tele/${ topic }/#`);
    this.client.subscribe(`stat/${ topic }/#`);
    this.client.on('message', this.onMessage.bind(this));

    // Send status command so device can announce itself.
    this.sendCommand('status');
  }

  sendCommand(command, payload) {
    this.log(`cmnd/${ this.getTopic() }/${ command }`, payload);
    this.client.publish(`cmnd/${ this.getTopic() }/${ command }`, payload);
    return this;
  }

  waitFor(command, timeout) {
    let resolve;
    let promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      timeout && setTimeout(() => _reject(Error('TIMEOUT')), timeout);
    });
    this.waitForQueue.push({ command, resolve });
    return promise;
  }

  onMessage(topic, message) {
    let [ type, _, command ] = topic.split('/');

    // Try to parse message. If it fails, assume it's just a string.
    try {
      var payload = JSON.parse(message);
    } catch(e) {
      var payload = message.toString();
    }
    this.log('received msg on', topic, ':', payload);

    // Handle commands.
    if (command === 'RESULT') {
      let key = Object.keys(payload)[0];
      let idx = this.waitForQueue.findIndex(entry => entry.command === key);
      if (idx !== -1) {
        let entry = this.waitForQueue[idx];
        this.waitForQueue.splice(idx, 1);
        entry.resolve(payload);
      }
    } else if (command === 'STATUS') {
      // Response to `status` command, so we know that the device is connected.
      this.setAvailable();

      // Update settings to reflect the values passed by the device.
      this.setSettings({
        powerOnState : String(payload.Status.PowerOnState),
        ledState     : String(payload.Status.LedState),
        topic        : payload.Status.Topic,
      });

      // Update on/off status
      return this.setCapabilityValue('onoff', !!payload.Status.Power);
    } else if (command === 'POWER') {
      return this.setCapabilityValue('onoff', payload === 'ON');
    } else if (command === 'LWT') {
      // "last will and testament"
      if (payload === 'Offline') {
        return this.setUnavailable(Homey.__('device.connection_lost'));
      } else {
        // Solicit current status from device.
        this.sendCommand('status');
        return this.setAvailable();
      }
    }
  }

  onCapabilityOnoff(value, opts, callback) {
    this.sendCommand('power', value ? 'on' : 'off');
    return callback(null);
  }

  onDeleted() {
    this.log('being deleted, cleaning up');
    this.client && this.client.end();
  }

  async onSettings(oldSettings, newSettings, changedKeys, callback) {
    // Check if any MQTT credentials have changed, in which case we need to
    // make sure they are valid before accepting them.
    if (changedKeys.find(k => k.startsWith('mqtt'))) {
      try {
        let client = await mqtt.connect(
          newSettings.mqttHost,
          newSettings.mqttPort,
          newSettings.mqttUser,
          newSettings.mqttPassword
        );
        // End old client.
        this.client.end();

        // Start using new client.
        this.client = client;
      } catch(e) {
        return callback(Error(Homey.__('mqtt.connection_error')));
      }
    }

    if (changedKeys.includes('powerOnState')) {
      try {
        let result = await this.sendCommand('poweronstate', newSettings.powerOnState).waitFor('PowerOnState');
        // Make sure the device reports back the new setting value.
        if (String(result.PowerOnState) !== newSettings.powerOnState) {
          throw Error('VALUE_MISMATCH');
        }
      } catch(e) {
        return callback(e);
      }
    }

    if (changedKeys.includes('ledState')) {
      try {
        let result = await this.sendCommand('ledstate', newSettings.ledState).waitFor('LedState');
        // Make sure the device reports back the new setting value.
        if (String(result.LedState) !== newSettings.ledState) {
          throw Error('VALUE_MISMATCH');
        }
      } catch(e) {
        return callback(e);
      }
    }

    // Accept new settings.
    return callback();
  }
}
