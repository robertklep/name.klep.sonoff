const MultiSwitchDevice = require('../../lib/tasmota/multiswitch/device');

module.exports = class SonoffTasmotaT12CHDevice extends MultiSwitchDevice {

  onInit() {
    this.switchCount = 2;
    super.onInit();
  }

}
