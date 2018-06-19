const OnOffDriver = require('../../lib/tasmota/onoff/driver');

module.exports = class SonoffTasmotaT11CHDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff T1 1CH' ];
  }
}
