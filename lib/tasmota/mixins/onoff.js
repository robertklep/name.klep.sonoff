module.exports.OnOffDriver = superclass => class extends superclass {

  supportedCapabilities() {
    return [ 'onoff' ].concat(super.supportedCapabilities());
  }

};

module.exports.OnOffDevice = superclass => class extends superclass {

  async onInit() {
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    return super.onInit();
  }

  async onCapabilityOnoff(value) {
    this.sendCommand('power', value ? 'on' : 'off');
    return true;
  }

  async onDeviceCameOnline(status) {
    await super.onDeviceCameOnline(status);
    if (status) {
      this.setCapabilityValue('onoff', !!status.Power);
    }
  }

  onMessageReceived(command, payload) {
    super.onMessageReceived(command, payload);
    if (command === 'power') {
      this.setCapabilityValue('onoff', payload === 'ON');
    }
  }

}
