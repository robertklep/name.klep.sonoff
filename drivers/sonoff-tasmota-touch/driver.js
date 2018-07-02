const { TasmotaDriver, mixins : { OnOffDriver } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaTouchDriver extends OnOffDriver(TasmotaDriver) {
  supportedModules() {
    return [ 'Sonoff Touch' ];
  }
}
