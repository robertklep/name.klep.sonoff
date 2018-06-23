const { TasmotaDevice, mixins : { OnOffDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaRFDevice extends OnOffDevice(TasmotaDevice) {}
