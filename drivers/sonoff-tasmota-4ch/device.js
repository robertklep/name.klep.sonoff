const MultiSwitchDevice = require('../../lib/tasmota/multiswitch/device');

module.exports = class SonoffTasmota4CHDevice extends MultiSwitchDevice {

  onInit() {
    this.switchCount = 4;
    super.onInit();
  }

}
