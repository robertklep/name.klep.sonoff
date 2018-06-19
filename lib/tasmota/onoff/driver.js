const Homey               = require('homey');
const SonoffTasmotaDriver = require('../driver');

// Driver for simple switch devices.
module.exports = class SonoffTasmotaOnOffDriver extends SonoffTasmotaDriver {
  supportedCapabilities() {
    return [ 'onoff' ];
  }
}
