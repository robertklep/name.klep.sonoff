const { TasmotaDevice, mixins : { OnOffDevice, SensorDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaThDevice extends SensorDevice(OnOffDevice(TasmotaDevice)) {}
