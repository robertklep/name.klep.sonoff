const { TasmotaDevice, mixins : { OnOffDevice, SensorDevice } }  = require('../../lib/tasmota');

module.exports = class SonoffTasmotaPowDevice extends SensorDevice(OnOffDevice(TasmotaDevice)) {}
