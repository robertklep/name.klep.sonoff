const Homey = require('homey');

module.exports = class SonoffDevice extends Homey.Device {
  async onInit() {
    this.log(`device init: name = ${ this.getName() }, device id = ${ this.getDeviceId() }`);

    // Device starts out as being unavailable, only when it has registered
    // itself will it become available.
    this.setUnavailable(Homey.__('device.waiting'));

    // register a capability listener
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this))

    // Get driver instance.
    this.driver = await this.getReadyDriver();
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

  // this method is called when the Device is added
  onAdded() {
    this.log('device added');
  }

  // this method is called when the Device is deleted
  onDeleted() {
    this.log('device deleted');
  }

  // this method is called when the Device has requested a state change (turned on or off)
  onCapabilityOnoff(value, opts, callback) {
    this.driver.switchDevice(this, value);
    return callback(null);
  }
}
