const { TasmotaDevice, mixins: { SensorDevice } } = require('../../lib/tasmota');

module.exports = class SonoffTasmotaGenericDevice extends SensorDevice(TasmotaDevice) {

  async onFlowAction(action, args, state) {
    if (action.endsWith('set-color')) {
      return this.conn.sendCommand('color', args.color);
    }
  }

}
