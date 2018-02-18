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
    this.rfDevices      = [];

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

  registerTasmotaDevice(device) {
    this.tasmotaDevices.push(device);
  }

  registerRfDevice(device) {
    this.rfDevices.push(device);
  }

  async apiListRfDevices() {
    return this.rfDevices;
  }
}
