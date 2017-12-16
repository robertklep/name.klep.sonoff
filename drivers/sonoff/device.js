const Homey = require('homey');

module.exports = class SonoffDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, model = ${ this.getModel() }, id = ${ this.getDeviceId() }`);

    // Device starts out as being unavailable, only when it has registered
    // itself will it become available.
    this.setUnavailable(Homey.__('device.waiting'));

    // Get driver instance.
    this.driver = await this.getReadyDriver();

    // Register a capability listener.
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))
  }

  // Get a (ready) instance of the driver.
  getReadyDriver() {
    return new Promise(resolve => {
      let driver = this.getDriver();
      driver.ready(() => resolve(driver));
    });
  }

  getDeviceId() {
    return this.getData().deviceId;
  }

  getModel() {
    return (this.getData().data || {}).model;
  }

  onAdded() {
    this.setAvailable();
    this.getDriver().onAdded(this);
  }

  onDeleted() {
    this.getDriver().onDeleted(this);
  }

  onCapabilityOnoff(value, opts, callback) {
    this.driver.switchDevice(this.getDeviceId(), value);
    return callback(null);
  }
}
