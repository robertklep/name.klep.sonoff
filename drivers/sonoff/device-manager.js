const Homey            = require('homey');
const { EventEmitter } = require('events');
const json             = JSON.stringify.bind(JSON);

// A semi-random API key prefix that we'll use to give each device
// a new unique API key. The device is concatenated to it.
const API_KEY_PREFIX = '4087EA6CA-1337-1337-1337-0';

class DeviceManager extends EventEmitter {
  constructor(driver) {
    super();
    this.driver         = driver;
    this.managedDevices = {};
    this.connections    = {};
    this.log('instantiated, paired devices:', driver.getDevices().map(d => d.getDeviceId()));
  }

  log() {
    return this.driver.log('[MANAGER]', ...arguments);
  }

  homeyDeviceForId(id) {
    return this.driver.getDevices().find(device => device.getDeviceId() === id);
  }

  deviceForId(id) {
    return this.managedDevices[id];
  }

  registerDevice(device, socket) {
    // If we already manage this device, only update it.
    if (device.deviceid in this.managedDevices) {
      device = this.managedDevices[device.deviceid];
    }

    // Instantiate new device.
    if (! (device instanceof ManagedDevice)) {
      device = this.deviceInstance(device);
    }

    // Set socket for device.
    device.setSocket(socket);

    // Find associated Homey device (if the device was paired before).
    let homeyDevice = this.homeyDeviceForId(device.deviceId);
    if (homeyDevice) {
      device.setHomeyDevice(homeyDevice);
    } else {
      setImmediate(() => this.emit('new_device', device));
    }

    // Housekeeping.
    this.managedDevices[device.deviceId] = device;
    this.connections   [device.deviceId] = socket;

    // Done.
    return device;
  }

  unregisterDevice(deviceId) {
    if (deviceId in this.managedDevices) {
      this.log('unregistering device', deviceId);
      delete this.managedDevices[deviceId];
      delete this.connections   [deviceId];
      return true;
    }
    return false;
  }

  deviceInstance(data) {
    return new ManagedDevice(this, data);
  }

}

class ManagedDevice extends EventEmitter {
  constructor(manager, data) {
    super();
    this.id      = this.deviceId = data.deviceid;
    this.apiKey  = API_KEY_PREFIX + data.deviceid;
    this.data    = data;
    this.manager = manager;
    this.driver  = manager.driver;
    this.log('became managed');

    // Action handlers.
    this.on('register', this.onRegister.bind(this));
    this.on('date',     this.onDate.bind(this));
    this.on('update',   this.onUpdate.bind(this));
    this.on('query',    this.onQuery.bind(this));
  }

  log() {
    return this.driver.log(`[${ this.deviceId }]`, ...arguments);
  }

  setHomeyDevice(homeyDevice) {
    this.homeyDevice = homeyDevice;
  }

  setSocket(socket) {
    if (this.socket === socket) return;
    this.socket = socket.on('message', message => {
      try {
        this.dispatch(JSON.parse(message));
      } catch(e) {
        this.log('malformed message', message);
      }
    });
  }

  dispatch(message) {
    this.emit(message.action || 'unknown', message);
  }

  onRegister(param) {
    this.log(
      `discovered ${this.homeyDevice ? this.homeyDevice.getName() : param.deviceid}, ${this.homeyDevice ? '' : 'un'}known device`
    );

    // Set availability state for Homey device.
    this.homeyDevice && this.homeyDevice.setAvailable();

    // Return a registration response. We accept registration requests from all
    // devices, since we assume they either are paired already, or they should
    // be paired.
    return this.send();
  }

  onDate() {
    return this.send({ date: new Date().toISOString() });
  }

  onUpdate(param) {
    if (! this.homeyDevice) return;
    this.log(`[UPDATE] ${ this.homeyDevice.getName() } → ${ param.params.switch }`);
    this.homeyDevice.setCapabilityValue('onoff', param.params.switch === 'on');
  }

  onQuery(param) {
    this.log('[QUERY]', param);
  }

  send(data) {
    return this.socket.send(
      json(
        Object.assign({
          error    : 0,
          deviceid : this.deviceId,
          apikey   : this.apiKey
        }, data)
      )
    );
  }

  switch(state) {
    state = state ? 'on' : 'off';
    this.log(`[SWITCH] ${ this.homeyDevice.getName() } → ${ state }`);
    return this.send({
      action    : 'update',
      sequence  : String(Date.now()),
      userAgent : 'app',
      from      : 'app',
      ts        : 0,
      params    : { switch : state }
    });
  }
}

module.exports = DeviceManager;
