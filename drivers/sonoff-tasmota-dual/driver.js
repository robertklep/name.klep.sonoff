const Homey               = require('homey');
const SonoffTasmotaDriver = require('../../lib/tasmota-driver/driver');

// Supported modules and capabilities for this driver.
const MODULES      = [ 'Sonoff Dual', 'Sonoff Dual R2' ];
const CAPABILITIES = [ 'onoff.1', 'onoff.2' ];

module.exports = class SonoffTasmotaDualDriver extends SonoffTasmotaDriver {

  onInit() {
    super.onInit();

    // Register flow triggers.
    this.triggers = {
      'switch-1-on'  : new Homey.FlowCardTriggerDevice('switch-1-on').register(),
      'switch-1-off' : new Homey.FlowCardTriggerDevice('switch-1-off').register(),
      'switch-2-on'  : new Homey.FlowCardTriggerDevice('switch-2-on').register(),
      'switch-2-off' : new Homey.FlowCardTriggerDevice('switch-2-off').register(),
    };

    // Register flow actions.
    [ 'switch-1-on', 'switch-1-off', 'switch-1-toggle',
      'switch-2-on', 'switch-2-off', 'switch-2-toggle' ].forEach(action => this.registerFlowAction(action));
  }

  supportedModules() {
    return MODULES;
  }

  supportedCapabilities() {
    return CAPABILITIES;
  }

}
