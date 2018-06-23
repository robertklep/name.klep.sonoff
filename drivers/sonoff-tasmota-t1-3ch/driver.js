const { TasmotaDriver, mixins : { MultiSwitchDriver } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT13CHDriver extends MultiSwitchDriver(TasmotaDriver, 3) {

  supportedModules() {
    return [ 'Sonoff T1 3CH' ];
  }

}
