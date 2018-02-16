const Homey = require('homey');

if (Homey.env.SYSLOG_HOST) {
  require('homey-syslog')();
}

module.exports = class SonoffApp extends Homey.App {
  onInit() {
    this.log('SonoffApp is running...');
    if (Homey.env.INSPECTOR) {
      require('inspector').open(9229, '0.0.0.0');
    }
    if (Homey.env.UPLOADER) {
      require('homey-app-upload-lib')(this.manifest);
    }
  }
}
