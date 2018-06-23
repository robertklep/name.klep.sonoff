const { TasmotaDevice, mixins : { MultiSwitchDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmota4CHDevice extends MultiSwitchDevice(TasmotaDevice, 4) {}
