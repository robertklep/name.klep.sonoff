const Homey = require('homey');

module.exports = class SonoffApp extends Homey.App {
  onInit() {
    this.log('SonoffApp is running...');
    if (Homey.env.DEBUG) {
      require('inspector').open(9229, '0.0.0.0');
    }
  }
}
