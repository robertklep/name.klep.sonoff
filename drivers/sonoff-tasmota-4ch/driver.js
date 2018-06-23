const { TasmotaDriver, mixins : { MultiSwitchDriver } } = require('../../lib/tasmota');

module.exports = class SonoffTasmota4CHDriver extends MultiSwitchDriver(TasmotaDriver, 4) {

  supportedModules() {
    return [ 'Sonoff 4CH', '4 Channel', 'Sonoff 4CH Pro' ];
  }

}
