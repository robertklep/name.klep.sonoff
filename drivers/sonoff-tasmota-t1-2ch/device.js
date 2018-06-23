const { TasmotaDevice, mixins : { MultiSwitchDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaT12CHDevice extends MultiSwitchDevice(TasmotaDevice, 2) {}
