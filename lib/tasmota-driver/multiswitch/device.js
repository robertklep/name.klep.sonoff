const SonoffTasmotaDevice = require('../device');

module.exports = class SonoffTasmotaMultiSwitchDevice extends SonoffTasmotaDevice {

  onInit() {
    super.onInit();

    // Register capability listeners.
    for (let switchNr = 1; switchNr <= this.switchCount; switchNr++) {
      this.registerCapabilityListener('onoff.' + switchNr, this.onCapabilityOnoff.bind(this, switchNr));
    }
  }

  async onDeviceCameOnline() {
    // Retrieve switch state.
    let state = await this.conn.getState();
    for (let switchNr = 1; switchNr <= this.switchCount; switchNr++) {
      this.onMessageReceived('power' + switchNr, state['POWER' + switchNr]);
    }
  }

  async onCapabilityOnoff(switchNr, value) {
    this.sendCommand('power' + switchNr, value ? 'on' : 'off');
    return true;
  }

  onMessageReceived(command, payload) {
    for (let switchNr = 1; switchNr <= this.switchCount; switchNr++) {
      if (command === 'power' + switchNr) {
        this.setCapabilityValue('onoff.' + switchNr, payload === 'ON');
        this.driver.triggers[payload === 'ON' ? `switch-${ switchNr }-on` : `switch-${ switchNr }-off`].trigger(this);
      }
    }
  }

  async onFlowAction(action, args, state) {
    let switchNr = /\d/.match(action)[0];
    let cap      = 'onoff.' + switchNr;
    let value    = action.endsWith('-toggle') ? !this.getCapabilityValue(cap) :
                   action.endsWith('-on')     ? true                          : false;

    this.setCapabilityValue(cap, value);
    return this.onCapabilityOnoff(switchNr, value);
  }
}
