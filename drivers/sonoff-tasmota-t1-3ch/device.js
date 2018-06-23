const { TasmotaDevice, mixins : { MultiSwitchDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT13CHDevice extends MultiSwitchDevice(TasmotaDevice, 3) {}
