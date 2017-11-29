const Homey = require('homey');
const json  = JSON.stringify.bind(JSON);

// A semi-random API key prefix that we'll use to give each device
// a new unique API key. The device is concatenated to it.
const API_KEY_PREFIX = '4087EA6CA-1337-1337-1337-00';

class DeviceManager {
  constructor(driver) {
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
    if (device.deviceid in this.managedDevices) {
      device = this.managedDevices[device.deviceid];
    }
    if (! (device instanceof ManagedDevice)) {
      device = this.deviceInstance(device);
    }
    device.setSocket(socket);
    let homeyDevice = this.homeyDeviceForId(device.deviceId);
    if (homeyDevice) {
      device.setHomeyDevice(homeyDevice);
    }
    this.managedDevices[device.deviceId] = device;
    this.connections[device.deviceId]    = socket;
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

class ManagedDevice {
  constructor(manager, data) {
    this.id      = this.deviceId = data.deviceid;
    this.apiKey  = API_KEY_PREFIX + data.deviceid;
    this.data    = data;
    this.manager = manager;
    this.driver  = manager.driver;
    this.log('started managing', this.deviceId);
  }

  log() {
    return this.driver.log('[MANAGED DEVICE]', ...arguments);
  }

  setSocket(socket) {
    this.socket = socket;
  }

  setHomeyDevice(homeyDevice) {
    this.homeyDevice = homeyDevice;
  }

  dispatch(action, param) {
    let method = 'on' + action[0].toUpperCase() + action.substring(1);
    if (method in this) {
      this[method](param);
    } else {
      this.log('unknown action', action);
    }
  }

  onRegister(param) {
    this.log(
      `registered ${this.homeyDevice ? this.homeyDevice.getName() : param.deviceid}, ${this.homeyDevice ? '' : 'un'}known device`
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
