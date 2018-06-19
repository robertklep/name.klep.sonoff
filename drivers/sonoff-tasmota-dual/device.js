const MultiSwitchDevice = require('../../lib/tasmota/multiswitch/device');

module.exports = class SonoffTasmotaDualDevice extends MultiSwitchDevice {

  onInit() {
    this.switchCount = 2;
    super.onInit();
  }

}
