const OnOffDriver = require('../../lib/tasmota/onoff/driver');

module.exports = class SonoffTasmotaBasicDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff Basic' ];
  }
}
