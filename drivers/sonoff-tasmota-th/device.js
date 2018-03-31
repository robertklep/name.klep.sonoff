const OnOffDevice = require('../../lib/tasmota-driver/onoff/device');
const isObject    = x => typeof x === 'object' && x !== null;
const SENSOR_MAP  = {
  Temperature : 'measure_temperature',
  Humidity    : 'measure_humidity',
}

module.exports = class SonoffTasmotaThDevice extends OnOffDevice {

  async onDeviceCameOnline(status) {
    if (status) {
      this.setCapabilityValue('onoff', !!status.Power);
    }
    // Retrieve sensor data.
    let result = await this.conn.sendCommand('status', '10').waitFor('status10.statussns');
    this.processSensorData(result);
  }

  onMessageReceived(command, payload) {
    if (command === 'sensor') {
      return this.processSensorData(payload);
    }
    return super.onMessageReceived(command, payload);
  }

  processSensorData(payload) {
    for (let key in payload) {
      let possibleSensorData = payload[key];
      if (! isObject(possibleSensorData)) continue;

      let isUpdated = false;
      for (let sensorUnit in SENSOR_MAP) {
        if (sensorUnit in possibleSensorData) {
          let capability   = SENSOR_MAP[sensorUnit];
          let currentValue = this.getCapabilityValue(capability);
          let newValue     = possibleSensorData[sensorUnit];

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
}
