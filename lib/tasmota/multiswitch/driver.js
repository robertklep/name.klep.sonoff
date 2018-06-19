const Homey               = require('homey');
const SonoffTasmotaDriver = require('../driver');

module.exports = class SonoffTasmotaMultiSwitchDriver extends SonoffTasmotaDriver {

  onInit() {
    super.onInit();

    this.capabilities = [];
    this.triggers     = {};
    for (let switchNr = 1; switchNr <= this.switchCount; switchNr++) {

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

  supportedModules() {
    return [];
  }

  supportedCapabilities() {
    return this.capabilities;
  }

}
