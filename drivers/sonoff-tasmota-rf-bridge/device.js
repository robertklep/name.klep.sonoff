const Homey               = require('homey');
const SonoffTasmotaDevice = require('../../lib/tasmota-driver/device');

module.exports = class SonoffTasmotaRfBridgeDevice extends SonoffTasmotaDevice {

  onMessageReceived(command, payload) {
    if (payload.RfReceived) {
      let data   = payload.RfReceived;
      let tokens = {
        sync      : Number(data.Sync),
        low       : Number(data.Low),
        high      : Number(data.High),
        code      : data.Data,
        key       : data.RfKey === 'None' ? -1 : Number(data.RfKey),
        timestamp : Date.now()
      };

      this.driver.triggers['bridge-rf-receive'].trigger(this, tokens);

      // Emit realtime event (used in the RF sniffer in the app settings).
      Homey.ManagerApi.realtime('rf.receive', Object.assign({
        timestamp : new Date(),
        device    : {
          id   : this.getData().id,
          name : this.getName(),
        },
      }, tokens));
    }
  }

  async transmit(sync, high, low, code) {
    let payload = `rfsync ${ sync }; rfhigh ${ high }; rflow ${ low }; rfcode #${ code }`;
    this.log('transmitting:', payload);
    this.sendCommand('backlog', payload);
    return true;
  }

  async onFlowAction(action, args, state) {
    if (action === 'bridge-rf-transmit') {
      return this.transmit(args.sync, args.high, args.low, args.code);
    }
  }
}
