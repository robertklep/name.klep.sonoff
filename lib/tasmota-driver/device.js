const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');

module.exports = class SonoffTasmotaDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, id = ${ this.getId() }, module type = ${ this.getModule() }, version = ${ this.getVersion() }, topic = ${ this.getTopic() }`);
    this.driver = this.getDriver();

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

    // Let device instance know it came online.
    this.onDeviceCameOnline(status);

    // Maintain online/offline status.
    this.conn.on('online', () => {
      this.log('device came online');
      this.setAvailable();
      this.onDeviceCameOnline(); // TODO: retrieve and pass status here
    }).on('offline', () => {
      this.log('device went offline');
      this.setUnavailable(Homey.__('device.connection_lost'));
      this.onDeviceWentOffline();
    });
  }

  onDeviceCameOnline() {
    // Handled in subclasses.
  }

  onDeviceWentOffline() {
    // Handled in subclasses.
  }

  sendCommand(command, payload) {
    this.conn.sendCommand(command, payload);
    return this;
  }

  async messageLoop() {
    while (true) {
      if (this.isDeleted) return;
      let { command, payload } = await this.conn.nextMessage();
      this.log('message received:', command, payload);
      this.onMessageReceived(command, payload);
    }
  }

  onMessageReceived(command, payload) {
    // Handled in subclasses.
  }

  onDeleted() {
    this.log('being deleted, cleaning up');
    this.isDeleted = true;
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
