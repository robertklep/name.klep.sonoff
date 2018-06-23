const { TasmotaDriver, mixins : { MultiSwitchDriver } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT12CHDriver extends MultiSwitchDriver(TasmotaDriver, 2) {

  supportedModules() {
    return [ 'Sonoff T1 2CH' ];
  }

}
