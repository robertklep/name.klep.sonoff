const { TasmotaDriver, mixins : { OnOffDriver } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaRFDriver extends OnOffDriver(TasmotaDriver) {
  supportedModules() {
    return [ 'Sonoff RF' ];
  }
}
