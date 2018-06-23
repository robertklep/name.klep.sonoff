const Homey             = require('homey');
const { TasmotaDriver } = require('../../lib/tasmota');

// Supported modules and capabilities for this driver.
const MODULES      = [ 'Sonoff TH' ];
const CAPABILITIES = [ 'onoff', 'measure_temperature', 'measure_humidity', 'last_update_timestamp' ];

module.exports = class SonoffTasmotaThDriver extends TasmotaDriver {

  onInit() {
    super.onInit();

    // Register flow triggers.
    this.triggers = {
      measure_temperature : new Homey.FlowCardTriggerDevice('th-temperature-changed').register(),
      measure_humidity    : new Homey.FlowCardTriggerDevice('th-humidity-changed').register(),
    };
  }

  supportedModules() {
    return MODULES;
  }

  supportedCapabilities() {
    return CAPABILITIES;
  }
}
