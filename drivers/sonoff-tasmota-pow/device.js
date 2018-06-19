const { mixins }  = require('../../lib/tasmota');
const OnOffDevice = require('../../lib/tasmota/onoff/device');

module.exports = class SonoffTasmotaPowDevice extends mixins.SensorDevice(OnOffDevice) {}
