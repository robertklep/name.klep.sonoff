const SonoffTasmotaDevice = require('../../lib/tasmota-driver/device');

module.exports = class SonoffTasmotaDualDevice extends SonoffTasmotaDevice {

  onInit() {
    super.onInit();

    // Register capability listeners.
    this.registerCapabilityListener('onoff.1', this.onCapabilityOnoff.bind(this, '1'));
    this.registerCapabilityListener('onoff.2', this.onCapabilityOnoff.bind(this, '2'));
  }

  async onDeviceCameOnline() {
    // Retrieve switch state.
    let state = await this.conn.getState();
    this.onMessageReceived('power1', state.POWER1);
    this.onMessageReceived('power2', state.POWER2);
  }

  async onCapabilityOnoff(switchNr, value) {
    this.sendCommand('power' + switchNr, value ? 'on' : 'off');
    return true;
  }

  onMessageReceived(command, payload) {
    if (command === 'power1') {
      this.setCapabilityValue('onoff.1', payload === 'ON');
      this.driver.triggers[payload === 'ON' ? 'switch-1-on' : 'switch-1-off'].trigger(this);
    } else if (command === 'power2') {
      this.setCapabilityValue('onoff.2', payload === 'ON');
      this.driver.triggers[payload === 'ON' ? 'switch-2-on' : 'switch-2-off'].trigger(this);
    }
  }

  async onFlowAction(action, args, state) {
    let switchNr = action.startsWith('switch-1-') ? '1' : '2';
    let cap      = 'onoff.' + switchNr;
    let value    = action.endsWith('-toggle') ? !this.getCapabilityValue(cap) :
                   action.endsWith('-on')     ? true                          : false;

    this.setCapabilityValue(cap, value);
    return this.onCapabilityOnoff(switchNr, value);
  }
}
