const { TasmotaDriver, mixins : { OnOffDriver } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT11CHDriver extends OnOffDriver(TasmotaDriver) {
  supportedModules() {
    return [ 'Sonoff T1 1CH' ];
  }
}
