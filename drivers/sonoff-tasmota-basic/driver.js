const { TasmotaDriver, mixins : { OnOffDriver } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaBasicDriver extends OnOffDriver(TasmotaDriver) {
  supportedModules() {
    return [ 'Sonoff Basic' ];
  }
}
