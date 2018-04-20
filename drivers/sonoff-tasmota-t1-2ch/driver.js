const MultiSwitchDriver = require('../../lib/tasmota-driver/multiswitch/driver');

// Supported modules.
const MODULES = [ 'Sonoff T1 2CH' ];

module.exports = class SonoffTasmotaT12CHDriver extends MultiSwitchDriver {

  onInit() {
    this.switchCount = 2;
    super.onInit();
  }

  supportedModules() {
    return MODULES;
  }

}
