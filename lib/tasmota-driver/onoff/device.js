const Homey               = require('homey');
const SonoffTasmotaDevice = require('../device');

// Device class for simple switch devices.
module.exports = class SonoffTasmotaOnOffDriver extends SonoffTasmotaDevice {

  onInit() {
    super.onInit();

    // Register capability listener.
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
  }

  async onDeviceCameOnline(status) {
    if (status) {
      this.setCapabilityValue('onoff', !!status.Power);
    }
  }

  async onCapabilityOnoff(value) {
    this.sendCommand('power', value ? 'on' : 'off');
    return true;
  }

  onMessageReceived(command, payload) {
    if (command === 'power') {
      return this.setCapabilityValue('onoff', payload === 'ON');
    }
  }
}
