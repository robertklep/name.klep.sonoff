const Homey               = require('homey');
const SonoffTasmotaDriver = require('../../lib/tasmota/driver');

// Supported modules and capabilities for this driver.
const MODULES      = [ 'Sonoff Bridge' ];
const CAPABILITIES = [ 'rf_transmit', 'rf_receive' ];

module.exports = class SonoffTasmotaRfBridgeDriver extends SonoffTasmotaDriver {

  onInit() {
    super.onInit();

    // Register flow triggers.
    this.triggers = { 'bridge-rf-receive' : new Homey.FlowCardTriggerDevice('bridge-rf-receive').register() };

    // Register flow actions.
    this.registerFlowAction('bridge-rf-transmit');
  }

  supportedModules() {
    return MODULES;
  }

  supportedCapabilities() {
    return CAPABILITIES;
  }

}
