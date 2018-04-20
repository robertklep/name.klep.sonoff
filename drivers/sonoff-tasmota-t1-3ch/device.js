const MultiSwitchDevice = require('../../lib/tasmota-driver/multiswitch/device');

module.exports = class SonoffTasmotaT13CHDevice extends MultiSwitchDevice {

  onInit() {
    this.switchCount = 3;
    super.onInit();
  }

}
