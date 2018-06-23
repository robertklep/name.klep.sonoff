const { TasmotaDevice, mixins : { OnOffDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT11CHDevice extends OnOffDevice(TasmotaDevice) {}
