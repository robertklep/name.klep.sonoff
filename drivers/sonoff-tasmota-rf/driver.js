const OnOffDriver = require('../../lib/tasmota-driver/onoff/driver');

module.exports = class SonoffTasmotaRFDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff RF' ];
  }
}
