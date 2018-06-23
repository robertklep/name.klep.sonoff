const { TasmotaDriver, mixins : { MultiSwitchDriver } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaDualDriver extends MultiSwitchDriver(TasmotaDriver, 2) {

  supportedModules() {
    return [ 'Sonoff Dual', 'Sonoff Dual R2' ];
  }

}
