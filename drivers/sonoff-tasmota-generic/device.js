const { TasmotaDevice, mixins: { SensorDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaGenericDevice extends SensorDevice(TasmotaDevice) {
}
