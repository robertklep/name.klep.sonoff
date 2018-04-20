const OnOffDriver = require('../../lib/tasmota-driver/onoff/driver');

module.exports = class SonoffTasmotaT11CHDriver extends OnOffDriver {
  supportedModules() {
    return [ 'Sonoff T1 1CH' ];
  }
}
