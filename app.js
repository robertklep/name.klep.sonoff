const Homey = require('homey');

if (Homey.env.SYSLOG_HOST) {
  require('homey-syslog')();
}

module.exports = class SonoffApp extends Homey.App {
  onInit() {
    this.log('SonoffApp is running...');

    // Various debugging/development tools.
    Homey.env.INSPECTOR && require('inspector').open(9229, '0.0.0.0');
    Homey.env.UPLOADER  && require('homey-app-upload-lib')(this.manifest);

    // Let devices register themselves with the app (useful in settings).
    this.sonoffDevices  = [];
    this.tasmotaDevices = [];

    // Register flow actions.
    this.registerFlowActions();
  }

  registerFlowActions() {
    new Homey.FlowCardAction('rf_transmit')
        .register()
        .registerRunListener((args, state) => {
          return args.device.transmit(args.sync, args.high, args.low, args.code);
        })
  }

  registerSonoffDevice(device) {
    this.sonoffDevices.push(device);
  }

  unregisterSonoffDevice(device) {
    let id = device.getDeviceId();
    let idx = this.sonoffDevices.findIndex(d => d.getDeviceId() === id);
    if (idx !== -1) {
      this.sonoffDevices.splice(idx, 1);
    }
  }

  registerTasmotaDevice(device) {
    this.tasmotaDevices.push(device);
  }

  unregisterTasmotaDevice(device) {
    let id  = device.getData().id;
    let idx = this.tasmotaDevices.findIndex(d => d.getData().id === id);
    if (idx !== -1) {
      this.tasmotaDevices.splice(idx, 1);
    }
  }

  async apiListRfDevices() {
    return this.tasmotaDevices.filter(d => d.hasCapability('rf_receive'));
  }

  async apiListTasmotaDevices() {
    return this.tasmotaDevices;
  }
}
