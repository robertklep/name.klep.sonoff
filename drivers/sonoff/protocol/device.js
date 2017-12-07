const Homey            = require('homey');
const { EventEmitter } = require('events');
const WatchDog         = require('watchout');

// A semi-random API key prefix that we'll use to give each device
// a new unique API key. The device id is concatenated to it.
const API_KEY_PREFIX = '4087EA6CA-1337-1337-1337-0';

module.exports = class ManagedDevice extends EventEmitter {
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
    this.on('unknown',  this.onUnknown.bind(this));
    this.on('error',    this.onError.bind(this));
  }

  log() {
    return this.driver.log(`[${ this.deviceId }]`, ...arguments);
  }

  setHomeyDevice(homeyDevice) {
    this.homeyDevice = homeyDevice;
  }

  getHomeyDevice() {
    return this.homeyDevice;
  }

  unregister() {
    // Stop watchdog.
    this.watchdog && this.watchdog.pass();
  }

  setSocket(socket) {
    if (this.socket === socket) return;
    // Instance will handle any incoming messages from the hardware device.
    this.socket = socket.on('message', message => {
      try {
        this.dispatch(JSON.parse(message));
      } catch(e) {
        this.log('malformed message', message);
      }
    });

    // Start watchdog.
    let watchdogInterval = setInterval(() => {
      this.send({ action : 'update', sequence : 'ping', params : { ping : true } });
    }, 2000);
    this.watchdog = new WatchDog(15000, wasHalted => {
      clearInterval(watchdogInterval);
      if (! wasHalted) {
        this.log('watchdog triggered');
        this.homeyDevice && this.homeyDevice.setUnavailable(Homey.__('device.connection_lost'));
        this.manager.unregisterDevice(this.deviceId);
      } else {
        this.log('watchdog stopped');
      }
    });
  }

  dispatch(message) {
    if ('error' in message && message.error !== 0) {
      return this.emit('error', message);
    } else if ('sequence' in message && message.sequence === 'Invalid sequence') {
      message.reason = message.sequence;
      return this.emit('error', message);
    }
    this.emit(message.action || 'unknown', message);
  }

  onRegister(param) {
    this.log(
      `registered ${this.homeyDevice ? this.homeyDevice.getName() : param.deviceid}, ${this.homeyDevice ? '' : 'un'}paired device`
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

  async onUpdate(param) {
    // Switch Homey device (if any).
    if (this.homeyDevice && param.params && 'switch' in param.params) {
      this.log(`[update] ${ this.homeyDevice.getName() } → ${ param.params.switch }`);
      this.homeyDevice.setCapabilityValue('onoff', param.params.switch === 'on');
    }
    // Acknowledge.
    this.send();
  }

  onQuery(param) {
    this.log('[query]', param);
    if (Array.isArray(param.params) && param.params.includes('timers')) {
      return this.send();
      /*
      return this.send({
        action   : 'update',
        sequence : String(Date.now()),
        params   : {
          timers : [{
            enabled : 1,
            type    : 'once',
            at      : new Date(Date.now() + 5000).toISOString(),
            do      : { switch : 'on' }
          }]
        }
      });
      */
    } else {
      return this.send();
    }
  }

  onUnknown(param) {
    // Check if this is a ping response. If so, reset watchdog.
    if (param.sequence === 'ping') {
      return this.watchdog.reset();
    }
    this.log('[unknown]', param);
  }

  onError(param) {
    this.log('[error]', param.reason);
  }

  send(data) {
    return this.socket.send(
      JSON.stringify(
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
    this.log(`[switch] ${ this.homeyDevice.getName() } → ${ state }`);
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
