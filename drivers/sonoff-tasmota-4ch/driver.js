const MultiSwitchDriver = require('../../lib/tasmota/multiswitch/driver');

// Supported modules.
const MODULES = [ 'Sonoff 4CH', '4 Channel', 'Sonoff 4CH Pro' ];

module.exports = class SonoffTasmota4CHDriver extends MultiSwitchDriver {

  onInit() {
    this.switchCount = 4;
    super.onInit();
  }

  supportedModules() {
    return MODULES;
  }

}
