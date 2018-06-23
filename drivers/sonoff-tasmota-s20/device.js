const { TasmotaDevice, mixins : { OnOffDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaS20Device extends OnOffDevice(TasmotaDevice) {}
