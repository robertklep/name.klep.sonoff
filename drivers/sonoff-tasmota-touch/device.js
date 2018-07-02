const { TasmotaDevice, mixins : { OnOffDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaTouchDevice extends OnOffDevice(TasmotaDevice) {}
