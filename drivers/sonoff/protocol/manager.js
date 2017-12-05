const Homey            = require('homey');
const https            = require('https');
const WebSocket        = require('ws');
const { EventEmitter } = require('events');
const ManagedDevice    = require('./device');

// TLS keys.
const KEYS = require('./keys.json');

// Port that the HTTPS and WS servers are listening on.
const PORT = 8305;

module.exports = class ProtocolManager extends EventEmitter {
  constructor(driver) {
    super();
    this.driver      = driver;
    this.devices     = {};
    this.connections = {};
    this.log('instantiated, paired devices:', driver.getDevices().map(d => d.getDeviceId()));
    this.startServers();
  }

  log() {
    return this.driver.log('[manager]', ...arguments);
  }

  async startServers() {
    // Determine local IP address for Homey.
    let internalIp = (await Homey.ManagerCloud.getLocalAddress()).replace(/:.*/, '');

    // Start HTTPS.
    this.log('starting HTTPS and WS servers');
    this.https = https.createServer(KEYS, (req, res) => {
      if (req.method === 'POST' && req.url === '/dispatch/device') {
        this.log(`[https] received dispatch request from ${ req.socket.remoteAddress }`);
        // Default response to point Sonoff to this server.
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({
          error  : 0,
          reason : 'ok',
          IP     : internalIp,
          port   : PORT
        }));
      } else {
        this.log('[https] Unhandled request', req.method, req.url);
        // Any other requests aren't handled.
        res.statusCode = 404;
        res.end();
      }
    }).listen(PORT);

    // Attach WS.
    this.wss = new WebSocket.Server({ server : this.https, path : '/api/ws' }).on('connection', socket => {
      let device;
      socket.on('message', message => {
        try {
          message = JSON.parse(message);
        } catch(e) {
          return this.log('[ws] malformed message')
        }

        // Make sure we can id the device that sent the message.
        if (! message.deviceid) {
          return this.log('[ws] unknown message')
        }

        // Remove listener (device will take over).
        socket.removeAllListeners('message');

        // Create managed device.
        device = this.registerDevice(message, socket);

        // Dispatch the message.
        device.dispatch(message);
      }).on('error', err => {
        this.log('[ws] socket error', err.message);
        if (device) {
          this.unregisterDevice(device.deviceId);
        }
      }).on('close', () => {
        if (device) {
          this.log(`[ws] ${ device.deviceId } closed connection, cleaning up`);
          this.unregisterDevice(device.deviceId);
        }
      });
    }).on('error', err => {
      this.log('[ws] server error', err.message);
    });
  }

  homeyDeviceForId(id) {
    return this.driver.getDevices().find(device => device.getDeviceId() === id);
  }

  deviceForId(id) {
    return this.devices[id];
  }

  // Find devices that are managed (discovered) but unpaired (not added to Homey yet).
  unpairedDevices() {
    let unpaired = [];
    for (let id in this.devices) {
      let device = this.devices[id];
      if (! this.devices[id].getHomeyDevice()) {
        unpaired.push(device);
      }
    }
    return unpaired;
  }

  registerDevice(device, socket) {
    // If we already manage this device, only update it.
    if (device.deviceid in this.devices) {
      device = this.devices[device.deviceid];
    }

    // Instantiate new device?
    if (! (device instanceof ManagedDevice)) {
      device = new ManagedDevice(this, device);
    }

    // Set WebSocket for device.
    device.setSocket(socket);

    // Find associated Homey device (if the device was paired before).
    let homeyDevice = this.homeyDeviceForId(device.deviceId);
    if (homeyDevice) {
      device.setHomeyDevice(homeyDevice);
    } else {
      // Emit an event to tell listeners (the driver) that we discovered a new
      // device. If the driver is in pairing mode, it will wait for this event.
      setImmediate(() => this.emit('new_device', device));
    }

    // Housekeeping.
    this.devices[device.deviceId]     = device;
    this.connections[device.deviceId] = socket;

    // Done.
    return device;
  }

  unregisterDevice(deviceId) {
    if (deviceId in this.devices) {
      this.log('unregistering device', deviceId);
      delete this.devices[deviceId];
      if (deviceId in this.connections) {
        // Forceably close the connection.
        this.connections[deviceId].terminate();
        delete this.connections[deviceId];
      }
      return true;
    }
    return false;
  }
}
