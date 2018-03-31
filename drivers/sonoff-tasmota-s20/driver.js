const OnOffDriver = require('../../lib/tasmota-driver/onoff/driver');

module.exports = class SonoffTasmotaS20Driver extends OnOffDriver {
  supportedModules() {
    return [ 'S20 Socket' ];
  }
}
