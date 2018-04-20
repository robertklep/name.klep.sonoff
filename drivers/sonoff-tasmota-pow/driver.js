const Homey               = require('homey');
const SonoffTasmotaDriver = require('../../lib/tasmota-driver/driver');

// Supported modules and capabilities for this driver.
const MODULES      = [ 'Sonoff Pow' ];
const CAPABILITIES = [ 'onoff', 'measure_power', 'measure_voltage', 'measure_current', 'power_factor', 'meter_power', 'last_update_timestamp' ];

module.exports = class SonoffTasmotaPowDriver extends SonoffTasmotaDriver {

  onInit() {
    super.onInit();

    // Register flow triggers.
    this.triggers = {
      measure_power   : new Homey.FlowCardTriggerDevice('pow-power-changed').register(),
      measure_current : new Homey.FlowCardTriggerDevice('pow-current-changed').register(),
      measure_voltage : new Homey.FlowCardTriggerDevice('pow-voltage-changed').register(),
    };
  }

  supportedModules() {
    return MODULES;
  }

  supportedCapabilities() {
    return CAPABILITIES;
  }
}
