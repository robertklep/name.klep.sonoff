const MultiSwitchDriver = require('../../lib/tasmota-driver/multiswitch/driver');

// Supported modules.
const MODULES = [ 'Sonoff Dual', 'Sonoff Dual R2' ];

module.exports = class SonoffTasmotaDualDriver extends MultiSwitchDriver {

  onInit() {
    this.switchCount = 2;
    super.onInit();
  }

  supportedModules() {
    return MODULES;
  }

}
