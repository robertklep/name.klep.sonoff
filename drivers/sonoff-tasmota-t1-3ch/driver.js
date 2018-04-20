const MultiSwitchDriver = require('../../lib/tasmota-driver/multiswitch/driver');

// Supported modules.
const MODULES = [ 'Sonoff T1 3CH' ];

module.exports = class SonoffTasmotaT13CHDriver extends MultiSwitchDriver {

  onInit() {
    this.switchCount = 3;
    super.onInit();
  }

  supportedModules() {
    return MODULES;
  }

}
