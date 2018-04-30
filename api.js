const Homey = require('homey');

module.exports = [
  {
    method : 'GET',
    path   : '/rf-devices/',
    fn     : async (args, callback) => {
      try {
        let devices = await Homey.app.apiListRfDevices();
        return callback(null, devices.map(device => ({
          id   : device.getData().id,
          name : device.getName(),
        })));
      } catch(err) {
        return callback(err);
      }
    }
  },
  {
    method : 'GET',
    path   : '/tasmota-devices/',
    fn     : async (args, callback) => {
      try {
        let devices = await Homey.app.apiListTasmotaDevices();
        for (let device of devices) {
          device._ipAddress = await device.getIpAddress();
        }
        return callback(null, devices.map(device => ({
          id        : device.getData().id,
          name      : device.getName(),
          topic     : device.getTopic(),
          ipAddress : device._ipAddress,
        })));
      } catch(err) {
        return callback(err);
      }
    }
  },
];
