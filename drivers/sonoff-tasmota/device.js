const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');
const { delay }         = require('./utils');

module.exports = class SonoffTasmotaDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, id = ${ this.getId() }, module type = ${ this.getModule() }, version = ${ this.getVersion() }, topic = ${ this.getTopic() }`);

    // Register a capability listener.
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

    // Get MQTT connection handle.
    this.setUnavailable(Homey.__('mqtt.waiting'));
    await this.connect();

    // Register device with app.
    Homey.app.registerTasmotaDevice(this);

    // Start message loop.
    this.messageLoop();
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
    try {
      this.conn = await this.getDriver().getConnectionForDevice(this);
    } catch(e) {
      this.log('unable to get MQTT connection from driver');
      this.setUnavailable(Homey.__('mqtt.connection_error'));
      return;
    }

    // Still waiting for device.
    this.setUnavailable(Homey.__('device.waiting'));

    // Wait for device to return status.
    let status = await this.conn.wait();

    // We now know the device is online.
    this.setAvailable();
    this.log('device came online');

    // Update settings to reflect the values passed by the device.
    this.setSettings({
      powerOnState : String(status.PowerOnState),
      ledState     : String(status.LedState),
      topic        : status.Topic,
    });

    // Update on/off status
    this.setCapabilityValue('onoff', !!status.Power);

    // Maintain online/offline status.
    this.conn.on('online', () => {
      this.log('device came online');
      this.setAvailable();
    }).on('offline', () => {
      this.log('device went offline');
      this.setUnavailable(Homey.__('device.connection_lost'));
    });
  }

  sendCommand(command, payload) {
    this.conn.sendCommand(command, payload);
    return this;
  }

  async messageLoop() {
    while (true) {
      let { command, payload } = await this.conn.nextMessage();
      this.log('message received:', command, payload);

      if (payload.RfReceived) {
        this.onRfReceived(payload.RfReceived);
      } else if (command === 'power') {
        this.onPowerReceived(payload);
      }
    }
  }

  async onRfReceived(data) {
    this.log('RF received:', data);
    this.getDriver().triggerRfReceive(this, {
      sync      : Number(data.Sync),
      low       : Number(data.Low),
      high      : Number(data.High),
      code      : data.Data,
      key       : data.RfKey === 'None' ? -1 : Number(data.RfKey),
      timestamp : Date.now()
    });
  }

  onPowerReceived(data) {
    this.log('power received:', data);
    this.setCapabilityValue('onoff', data === 'ON');
  }

  async transmit(sync, high, low, code) {
    let payload = `rfsync ${ sync }; rfhigh ${ high }; rflow ${ low }; rfcode #${ code }`;
    this.log('transmitting:', payload);
    this.sendCommand('backlog', payload);
    return true;
  }

  async onCapabilityOnoff(value, opts) {
    this.sendCommand('power', value ? 'on' : 'off');
    return true;
  }

  onDeleted() {
    this.log('being deleted, cleaning up');
    Homey.app.unregisterTasmotaDevice(this);
    this.conn && this.conn.end();
  }

  async onSettings(oldSettings, newSettings, changedKeys, callback) {
    // Check if any MQTT credentials have changed, in which case we need to
    // make sure they are valid before accepting them.
    if (changedKeys.find(k => k.startsWith('mqtt'))) {
      try {
        let conn = await this.getDriver().getConnectionForDevice(this, {
          retry    : false,
          settings : newSettings
        });

        // End old client.
        this.conn && this.conn.end();

        // Start using new client.
        this.conn = conn;
      } catch(e) {
        return callback(Error(Homey.__('mqtt.connection_error')));
      }
    }

    if (changedKeys.includes('powerOnState')) {
      try {
        let result = await this.conn.sendCommand('poweronstate', newSettings.powerOnState).waitFor('result.poweronstate');
        // Make sure the device reports back the new setting value.
        if (String(result) !== newSettings.powerOnState) {
          throw Error('VALUE_MISMATCH');
        }
      } catch(e) {
        return callback(e);
      }
    }

    if (changedKeys.includes('ledState')) {
      try {
        let result = await this.conn.sendCommand('ledstate', newSettings.ledState).waitFor('result.ledstate');
        // Make sure the device reports back the new setting value.
        if (String(result) !== newSettings.ledState) {
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
