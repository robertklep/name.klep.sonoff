const { TasmotaDevice, mixins : { MultiSwitchDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaDualDevice extends MultiSwitchDevice(TasmotaDevice, 2) {}
