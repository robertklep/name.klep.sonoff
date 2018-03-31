const OnOffDriver = require('../../lib/tasmota-driver/onoff/driver');

module.exports = class SonoffTasmotaBasicDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff Basic' ];
  }
}
