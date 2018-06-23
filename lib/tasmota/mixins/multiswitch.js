const Homey = require('homey');

module.exports.MultiSwitchDriver = (superclass, switchCount = 2) => class extends superclass {

  async onInit() {
    await super.onInit();

    this.capabilities = [];
    this.triggers     = {};
    for (let switchNr = 1; switchNr <= switchCount; switchNr++) {

      [ 'on', 'off', 'toggle' ].forEach(type => {
        let prop     = `switch-${ switchNr }-${ type }`;
        let flowName = `${ this.id }-${ prop }`;

        // Register flow triggers.
        if (type !== 'toggle') {
          this.triggers[prop] = new Homey.FlowCardTriggerDevice(flowName).register();
        }

        // Register flow actions.
        this.registerFlowAction(flowName);
      });

      // Register capability.
      this.capabilities.push('onoff.' + switchNr);
    }
  }

  supportedCapabilities() {
    return this.capabilities.concat(super.supportedCapabilities());
  }

};

module.exports.MultiSwitchDevice = (superclass, switchCount = 2) => class extends superclass {

  async onInit() {
    // Register capability listeners.
    for (let switchNr = 1; switchNr <= switchCount; switchNr++) {
      this.registerCapabilityListener('onoff.' + switchNr, this.onCapabilityOnoff.bind(this, switchNr));
    }
    return super.onInit();
  }

  async onDeviceCameOnline() {
    await super.onDeviceCameOnline();

    // Retrieve switch state.
    let state = await this.conn.getState();
    for (let switchNr = 1; switchNr <= switchCount; switchNr++) {
      this.onMessageReceived('power' + switchNr, state['POWER' + switchNr]);
    }
  }

  async onMessageReceived(command, payload) {
    await super.onMessageReceived(command, payload);

    for (let switchNr = 1; switchNr <= switchCount; switchNr++) {
      if (command === 'power' + switchNr) {
        this.setCapabilityValue('onoff.' + switchNr, payload === 'ON');
        this.driver.triggers[payload === 'ON' ? `switch-${ switchNr }-on` : `switch-${ switchNr }-off`].trigger(this);
      }
    }
  }

  async onCapabilityOnoff(switchNr, value) {
    this.sendCommand('power' + switchNr, value ? 'on' : 'off');
    return true;
  }

  async onFlowAction(action, args, state) {
    let switchNr = /-(\d)-/.exec(action)[1];
    let cap      = 'onoff.' + switchNr;
    let value    = action.endsWith('-toggle') ? !this.getCapabilityValue(cap) :
                   action.endsWith('-on')     ? true                          : false;

    this.setCapabilityValue(cap, value);
    return this.onCapabilityOnoff(switchNr, value);
  }
};
