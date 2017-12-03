const Homey         = require('homey');
const https         = require('https');
const WebSocket     = require('ws');
const DeviceManager = require('./device-manager');

// TLS keys.
const KEYS = require('./keys.json');

// Port that the HTTPS and WS servers are listening on.
const PORT = 8305;

module.exports = class SonoffDriver extends Homey.Driver {
  async onInit() {
    this.log('[INIT]');

    // Determine local IP address for Homey.
    let internalIp = (await Homey.ManagerCloud.getLocalAddress()).replace(/:.*/, '');

    // Instantiate device manager. The manager associates Homey devices with
    // hardware devices.
    this.manager = new DeviceManager(this);

    // Start HTTPS.
    this.log('[INIT] starting HTTPS and WS servers');
    this.server = https.createServer(KEYS, (req, res) => {
      if (req.method === 'POST' && req.url === '/dispatch/device') {
        this.log(`[HTTPS] received dispatch request from ${ req.socket.remoteAddress }`);
        // Default response to point Sonoff to this server.
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({
          error  : 0,
          reason : 'ok',
          IP     : internalIp,
          port   : PORT
        }));
      } else {
        this.log('[HTTPS] Unhandled request', req.method, req.url);
        // Any other requests aren't handled.
        res.statusCode = 404;
        res.end();
      }
    }).listen(PORT);

    // Attach WS.
    this.wss = new WebSocket.Server({ server : this.server, path : '/api/ws' }).on('connection', socket => {
      let device;
      socket.on('message', message => {
        try {
          message = JSON.parse(message);
        } catch(e) {
          return this.log('[WS] malformed message')
        }

        // Make sure we can id the device that sent the message.
        if (! message.deviceid) {
          return this.log('[WS] unknown message')
        }

        // Remove listener (device will take over).
        socket.removeAllListeners('message');

        // Create managed device.
        device = this.manager.registerDevice(message, socket);

        // Dispatch the message.
        device.dispatch(message);
      }).on('error', err => {
        this.log('[WS] socket error', err.message);
        if (device) {
          this.manager.unregisterDevice(device.deviceId);
        }
      }).on('close', () => {
        if (device) {
          this.log(`[WS] ${ device.deviceId } closed connection, cleaning up`);
          this.manager.unregisterDevice(device.deviceId);
        }
      });
    }).on('error', err => {
      this.log('[WS] server error', err.message);
    });
  }

  switchDevice(deviceId, state) {
    let managedDevice = this.manager.deviceForId(deviceId);
    if (! managedDevice) {
      return this.log(`[SWITCH] asked to switch unmanaged device (${ deviceId })`);
    }
    managedDevice.switch(state);
  }

  getDeviceForId(id) {
    return this.getDevices().find(device => device.getDeviceId() === id);
  }

  onPairListDevices(data, callback) {
    const pairDevices = devices => {
      return callback(null, devices.map(device => {
        let name = `${ device.data.model }@${ device.deviceId} (ROM ${ device.data.romVersion })`;
        this.log('[PAIRING] got pairing request from', name);
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
      this.log(`[PAIRING] got ${ unpaired.length } device(s) ready to pair`);
      pairDevices(unpaired);
    } else {
      // Wait for first device to announce itself.
      this.log('[PAIRING] waiting for device to pair');
      this.manager.once('new_device', device => pairDevices([ device ]));
    }
  }

  onDeleted(device) {
    this.log('[DRIVER] device got deleted', device.getName());
    this.manager.unregisterDevice(device.getDeviceId());
  }

  onAdded(device) {
    let managedDevice = this.manager.deviceForId(device.getDeviceId());
    if (managedDevice) {
      managedDevice.setHomeyDevice(device);
    }
  }
}
