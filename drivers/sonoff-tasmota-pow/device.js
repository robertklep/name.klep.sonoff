const OnOffDevice = require('../../lib/tasmota-driver/onoff/device');
const SENSOR_MAP  = {
  Voltage : 'measure_voltage',
  Power   : 'measure_power',
  Current : 'measure_current',
  // TODO: meter_power
}

module.exports = class SonoffTasmotaPowDevice extends OnOffDevice {

  async onDeviceCameOnline(status) {
    if (status) {
      this.setCapabilityValue('onoff', !!status.Power);
    }

    // Start periodically updating the power stats.
    this.startUpdater();

    // Retrieve sensor data.
    this.updatePowerStatus();
  }

  onDeviceWentOffline() {
    this.stopUpdater();
  }

  startUpdater() {
    this.stopUpdater();
    // Periodically update power stats (TODO: make configurable)
    this.updateInterval = setInterval(() => this.updatePowerStatus(), 10000);
  }

  stopUpdater() {
    this.updateInterval && clearInterval(this.updateInterval);
  }

  async updatePowerStatus() {
    let result = await this.conn.sendCommand('status', '8').waitFor('status8.statussns');
    this.processSensorData(result);
  }

  async onMessageReceived(command, payload) {
    if (command === 'sensor') {
      return this.processSensorData(payload);
    } else if (command === 'power') {
      // Run an update ramp until the update interval takes over.
      setTimeout(() => this.updatePowerStatus(), 1000);
      setTimeout(() => this.updatePowerStatus(), 2000);
      setTimeout(() => this.updatePowerStatus(), 3000);
      setTimeout(() => this.updatePowerStatus(), 5000);
    }
    return super.onMessageReceived(command, payload);
  }

  processSensorData(payload) {
    let sensorData = payload.ENERGY;
    if (! sensorData) return;

    let isUpdated = false;
    for (let sensorUnit in SENSOR_MAP) {
      if (sensorUnit in sensorData) {
        let capability   = SENSOR_MAP[sensorUnit];
        let currentValue = this.getCapabilityValue(capability);
        let newValue     = sensorData[sensorUnit];

        if (currentValue !== newValue) {
          this.setCapabilityValue(capability, newValue);
          this.driver.triggers[capability].trigger(this, {
            [ sensorUnit.toLowerCase() ] : newValue,
            previous                     : currentValue,
          });
        }
        isUpdated = true;
      }
    }

    if (isUpdated) {
      let now  = new Date();
      let date = now.toISOString().split('T')[0];
      let time = now.toString().substring(16, 24);
      this.setCapabilityValue('last_update_timestamp', `${ date } ${ time }`);
    }
  }
}
