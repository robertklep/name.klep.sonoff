const { TasmotaDevice, mixins : { OnOffDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaBasicDevice extends OnOffDevice(TasmotaDevice) {}
