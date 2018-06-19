const OnOffDriver = require('../../lib/tasmota/onoff/driver');

module.exports = class SonoffTasmotaRFDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff RF' ];
  }
}
