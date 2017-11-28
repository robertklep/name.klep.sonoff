const Homey       = require('homey');
const https       = require('https');
const WebSocket   = require('ws');

const API_KEY_PREFIX  = '4087EA6CA-1337-1337-1337-00';
const KEYS            = require('./keys.json');
const PORT            = 8305;

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
    this.log('[INIT] registered devices:', this.getDevices().map(d => d.getDeviceId()));

    // Determine local IP address for Homey.
    let internalIp = (await Homey.ManagerCloud.getLocalAddress()).replace(/:.*/, '');

    // Start HTTPS.
    this.log('[INIT] starting HTTPS and WS servers');
    this.server = https.createServer(KEYS, (req, res) => {
      //this.log(`received request from ${ req.socket.localAddress }`, req.headers);

      // Default response to point Sonoff to this server.
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        error  : 0,
        reason : 'ok',
        IP     : internalIp,
        port   : PORT
      }));
    }).listen(PORT);

    // Attach WS.
    this.connectedDevices = {};
    this.wss = new WebSocket.Server({ server : this.server }).on('connection', socket => {
      //this.log('new WS connection');
      let deviceId;
      socket.on('message', message => {
        //this.log('received message', message);
        try {
          message = JSON.parse(message);
        } catch(e) {
          return this.log('[WS] malformed message')
        }

        // Store device id and connection.
        deviceId = message.deviceid;
        this.connectedDevices[deviceId] = socket;

        // Dispatch message to method.
        let method = 'on' + message.action[0].toUpperCase() + message.action.substring(1);
        if (method in this) {
          this[method](DeviceObject(message, socket), message);
        } else {
          this.log('[WS] received unhandled message', message);
        }
      }).on('error', err => {
        this.log('[WS] socket error', err.message);
        delete this.connectedDevices[deviceId];
      }).on('close', () => {
        delete this.connectedDevices[deviceId];
      });
    }).on('error', err => {
      this.log('[WS] server error', err.message);
    });
  }

  onRegister(device) {
    let knownDevice = this.getDeviceForId(device.deviceId);
    this.log(`[REGISTER] ${ knownDevice ? knownDevice.getName() : device.deviceId }, ${ knownDevice ? '' : 'un' }known device`);

    // If we're waiting for a device to pair, and this device isn't
    // yet known to us, resolve the deferred so the device can be
    // presented in the list of devices.
    if (this.waitingForDevice && ! knownDevice) {
      this.waitingForDevice.resolve(device);
    }

    // Set availability state for known devices.
    knownDevice && knownDevice.setAvailable();

    // Return a registration response. We accept registration
    // requests from all devices, since we assume they either
    // are paired already, or they should be paired.
    return device.socket.send(JSON.stringify({
      error    : 0,
      deviceid : device.deviceId,
      apikey   : device.apiKey,
    }));
  }

  onDate(device) {
    return device.socket.send(JSON.stringify({
      error    : 0,
      date     : new Date().toISOString(),
      deviceid : device.deviceId,
      apikey   : device.apiKey
    }));
  }

  onUpdate(device, message) {
    // Find device to update.
    device = this.getDeviceForId(device.deviceId);
    if (device) {
      this.log(`[UPDATE] ${ device.getName() } → ${ message.params.switch }`);
      device.setCapabilityValue('onoff', message.params.switch === 'on');
    }
  }

  switchDevice(device, state) {
    let socket = this.connectedDevices[device.getDeviceId()];
    if (! socket) {
      return this.log(`[SWITCH] asked to switch unconnected device ${ device.getName() }`);
    }
    this.log(`[SWITCH] ${ device.getName() } → ${ state ? 'on' : 'off' }`);
    socket.send(JSON.stringify({
      action : 'update',
      value  : {
        switch : state ? 'on' : 'off'
      }
    }));
  }

  getDeviceForId(id) {
    return this.getDevices().find(device => device.getDeviceId() === id);
  }

  onPairListDevices(data, callback) {
    this.log('[PAIRING] waiting for device to pair');
    // Wait for first device to announce itself.
    let defer = this.waitingForDevice = new Deferred();
    defer.then(deviceObj => {
      this.log('[PAIRING] got pairing request from', deviceObj.deviceId);
      this.waitingForDevice = null;
      return callback(null, [{
        name : `${ deviceObj.model }@${ deviceObj.deviceId} (ROM ${ deviceObj.romVersion })`,
        data : deviceObj
      }]);
    }).catch(e => {
      this.waitingForDevice = null;
      this.log('[PAIRING] error', e.message);
    });
  }
}

function DeviceObject(message, socket) {
  let obj = {
    id         : message.deviceid,
    deviceId   : message.deviceid,
    apiKey     : API_KEY_PREFIX + message.deviceid,
    romVersion : message.romVersion,
    model      : message.model,
    version    : message.version
  }
  Object.defineProperty(obj, 'socket', { value : socket });
  return obj;
}
