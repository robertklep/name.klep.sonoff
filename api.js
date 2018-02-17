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
];
