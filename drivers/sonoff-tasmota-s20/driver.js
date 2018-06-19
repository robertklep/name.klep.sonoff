const OnOffDriver = require('../../lib/tasmota/onoff/driver');

module.exports = class SonoffTasmotaS20Driver extends OnOffDriver {
  supportedModules() {
    return [ 'S20 Socket' ];
  }
}
