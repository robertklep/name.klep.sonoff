const Homey = require('homey');
const { TasmotaDriver,
        mixins       : { SensorDriver },
        capabilities : { capabilitiesForSensor } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaGenericDriver extends TasmotaDriver {

  onInit() {
    super.onInit();

    // Register flow triggers.
    this.triggers = {
      measure_temperature: new Homey.FlowCardTriggerDevice('generic-temperature-changed').register(),
      measure_humidity:    new Homey.FlowCardTriggerDevice('generic-humidity-changed').register(),
      measure_pressure:    new Homey.FlowCardTriggerDevice('generic-pressure-changed').register(),
      measure_distance:    new Homey.FlowCardTriggerDevice('generic-distance-changed').register(),
      measure_ultraviolet: new Homey.FlowCardTriggerDevice('generic-ultraviolet-changed').register(),
      measure_luminance:   new Homey.FlowCardTriggerDevice('generic-luminance-changed').register(),
      measure_voc:         new Homey.FlowCardTriggerDevice('generic-voc-changed').register(),
      measure_co:          new Homey.FlowCardTriggerDevice('generic-co-changed').register(),
      measure_co2:         new Homey.FlowCardTriggerDevice('generic-co2-changed').register(),
    };
  }

  supportedModules() {
    return [ 'Generic' ];
  }

  // Return which capabilities are supported by the device.
  async supportedCapabilities(device) {
    // Retrieve the list of connected sensors.
    let sensors = await device.getSensors(20000);

    // Map sensors to Homey capabilities.
    let caps = sensors.reduce((acc, sensor) => {
      for (let cap of capabilitiesForSensor(sensor)) {
        if (! acc.includes(cap)) {
          acc.push(cap);
        }
      }
      return acc;
    }, []);

    // Keep track of last update.
    if (caps.length) {
      caps.push('last_update_timestamp');
    }

    // TODO: sniff out other capabilities (RFSend, ...)
    return caps;
  }
}
