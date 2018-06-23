const { sensorDataToHomey, homeyToCommand } = require('../capabilities');
const isObject              = x => typeof x === 'object' && x !== null;

module.exports.SensorDriver = superclass => class extends superclass {
};

module.exports.SensorDevice = superclass => class extends superclass {

  async onInit() {
    // Register a generic listener for all capabilities that this device supports.
    // We have to do this _before_ calling the superclass onInit because we can only
    // register one listener per capability, and we let the superclass override any
    // generic listeners.
    for (let cap of this.getCapabilities()) {
      this.registerCapabilityListener(cap, this.onCapability.bind(this, cap));
    }
    await super.onInit();
  }

  async onCapability(capability, value, opts) {
    super.onCapability(capability, value, opts);
    this.log('onCapability', capability, value, opts);
    if ([ 'light_hue', 'light_saturation', 'dim' ].includes(capability)) {
      let HSB = [
        360.0 * this.getCapabilityValue('light_hue'),
        100.0 * this.getCapabilityValue('light_saturation'),
        100.0 * this.getCapabilityValue('dim'),
      ];
      this.log('sending hsb', HSB);
      return this.conn.sendCommand('hsbcolor', HSB.join(','));
    }
  }

  async onDeviceCameOnline(status) {
    super.onDeviceCameOnline(status);

    // Retrieve teleperiod and update settings.
    let telePeriod = Number(await this.conn.sendCommand('teleperiod').waitFor('result.teleperiod'));
    this.setSettings({ telePeriod });

    // Update color
    if (isObject(status) && 'HSBColor' in status) {
      this.processSensorData(status);
    }

    // Retrieve sensor data.
    this.processSensorData(await this.conn.sendCommand('status', '10').waitFor('status10.statussns'));
  }

  onMessageReceived(command, payload) {
    if (command === 'sensor') {
      this.processSensorData(payload);
    }
    if (command === 'status10') {
      this.processSensorData(payload.StatusSNS);
    }
    if (command === 'result' && 'HSBColor' in payload) {
      this.processSensorData(payload);
    }
    return super.onMessageReceived(command, payload);
  }

  processSensorData(payload) {
    let isUpdated = false;
    let caps      = sensorDataToHomey(payload);

    this.log('CAPS', caps);

    for (let cap of Object.keys(caps)) {
      if (! this.hasCapability(cap)) continue;
      let newValue     = caps[cap];
      let currentValue = this.getCapabilityValue(cap);

      if (currentValue !== newValue) {
        this.setCapabilityValue(cap, newValue);
        this.log(`${ cap } value changed, new = ${ newValue }, previous = ${ currentValue }`);
        if (this.driver.triggers && (cap in this.driver.triggers)) {
          this.log('triggering for', cap);
          this.driver.triggers[cap].trigger(this, {
            value    : newValue,
            previous : currentValue,
          });
        }
        isUpdated = true;
      }
    }

    if (isUpdated && this.hasCapability('last_update_timestamp')) {
      let now  = new Date();
      let date = now.toISOString().split('T')[0];
      let time = now.toString().substring(16, 24);
      this.setCapabilityValue('last_update_timestamp', `${ date } ${ time }`);
    }
  }

  async onSettings(oldSettings, newSettings, changedKeys, callback) {
    try {
      await super.onSettings(oldSettings, newSettings, changedKeys, err => { if (err) throw err });

      if (changedKeys.includes('telePeriod')) {
        await this.conn.sendCommand('teleperiod', String(newSettings.telePeriod));
      }

    } catch(e) {
      return callback(e);
    }
    return callback();
  }

};
