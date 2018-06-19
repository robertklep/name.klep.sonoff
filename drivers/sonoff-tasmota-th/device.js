const { mixins }  = require('../../lib/tasmota');
const OnOffDevice = require('../../lib/tasmota/onoff/device');

module.exports = class SonoffTasmotaThDevice extends mixins.SensorDevice(OnOffDevice) {}
