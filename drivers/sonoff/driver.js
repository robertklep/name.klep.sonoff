const Homey               = require('homey');
const { ProtocolManager } = require('./protocol');

module.exports = class SonoffDriver extends Homey.Driver {
  async onInit() {
    this.log('[init]');
    // The protocol manager manages the communication with the hardware devices.
    this.manager = new ProtocolManager(this);
  }

  switchDevice(deviceId, state) {
    let managedDevice = this.manager.deviceForId(deviceId);
    if (! managedDevice) {
      return this.log(`[switch] asked to switch unmanaged device (${ deviceId })`);
    }
    managedDevice.switch(state);
  }

  onPair(socket) {
    socket.on('device.list', (data, callback) => {
      const pairDevices = devices => {
        return callback(null, devices.map(device => {
          let name = `${ device.data.model }@${ device.deviceId} (ROM ${ device.data.romVersion })`;
          this.log('[pairing] got pairing request from', name);
          return {
            name,
            data : {
              id       : device.id,
              deviceId : device.deviceId,
              apiKey   : device.apiKey,
              data     : device.data
            }
          }
        }));
      }

      // Check if the manager is managing any unpaired devices.
      let unpaired = this.manager.unpairedDevices();
      if (unpaired.length) {
        this.log(`[pairing] got ${ unpaired.length } device(s) ready to pair`);
        pairDevices(unpaired);
      } else {
        // Wait for first device to announce itself.
        this.log('[pairing] waiting for device to pair');
        this.manager.once('new_device', device => pairDevices([ device ]));
      }
    }).on('device.identify', (device, callback) => {
      this.switchDevice(device.data.id, true);
      setTimeout(() => {
        this.switchDevice(device.data.id, false);
        return callback();
      }, 1000);
    });
  }

  onDeleted(device) {
    this.log('[driver] device got deleted', device.getName());
    this.manager.unregisterDevice(device.getDeviceId());
  }

  onAdded(device) {
    let managedDevice = this.manager.deviceForId(device.getDeviceId());
    if (managedDevice) {
      managedDevice.setHomeyDevice(device);
    }
  }
}
