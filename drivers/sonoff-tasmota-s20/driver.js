const { TasmotaDriver, mixins : { OnOffDriver } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaS20Driver extends OnOffDriver(TasmotaDriver) {
  supportedModules() {
    return [ 'S20 Socket' ];
  }
}
