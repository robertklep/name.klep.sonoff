const Homey         = require('homey');
const https         = require('https');
const WebSocket     = require('ws');
const DeviceManager = require('./device-manager');

const API_KEY_PREFIX  = '4087EA6CA-1337-1337-1337-00';
const KEYS            = require('./keys.json');
const PORT            = 8305;
const json            = JSON.stringify.bind(JSON);

class Deferred {
  constructor() {
    let resolve, reject;
    let promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject  = _reject;
    })
    promise.resolve = resolve;
    promise.reject  = reject;
    return promise;
  }
}

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
        return res.end(json({
          error  : 0,
          reason : 'ok',
          IP     : internalIp,
          port   : PORT
        }));
      }

      // Any other requests aren't handled.
      res.statusCode = 404;
      res.end();
    }).listen(PORT);

    // Attach WS.
    this.wss = new WebSocket.Server({ server : this.server }).on('connection', socket => {
      let device;
      socket.on('message', message => {
        //this.log('received message', message);
        try {
          message = JSON.parse(message);
        } catch(e) {
          return this.log('[WS] malformed message')
        }

        // Register managed device.
        device = this.manager.registerDevice(message, socket);

        // Dispatch message to device.
        if ('action' in message) {
          device.dispatch(message.action, message);

          // If we're waiting for a device to pair, resolve the deferred
          // when this is a registration message.
          if (message.action === 'register' && this.waitingToPair) {
            this.waitingToPair.resolve(device);
          }
        }
      }).on('error', err => {
        this.log('[WS] socket error', err.message);
        this.manager.unregisterDevice(device.deviceId);
      }).on('close', () => {
        this.manager.unregisterDevice(device.deviceId);
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
    this.log('[PAIRING] waiting for device to pair');
    // Wait for first device to announce itself.
    let defer = this.waitingToPair = new Deferred();
    defer.then(device => {
      let name = `${ device.data.model }@${ device.deviceId} (ROM ${ device.data.romVersion })`;
      this.log('[PAIRING] got pairing request from', name);
      this.waitingToPair = null;
      return callback(null, [{
        name,
        data : {
          id       : device.id,
          deviceId : device.deviceId,
          apiKey   : device.apiKey,
          data     : device.data
        }
      }]);
    }).catch(e => {
      this.waitingToPair = null;
      this.log('[PAIRING] error', e.message);
    });
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
