const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');
const constants         = require('./constants');

module.exports = class SonoffTasmotaDriver extends Homey.Driver {
  async onInit() {
    this.log('[init]');
    this.registerFlowTriggers();
    this.registerFlowActions();
    this.connections = {};
  }

  registerFlowTriggers() {
    this.flowTriggerRfReceive = new Homey.FlowCardTriggerDevice('rf_receive').register();
  }

  registerFlowActions() {
    new Homey.FlowCardAction('rf_transmit')
        .register()
        .registerRunListener((args, state) => {
          return args.device.transmit(args.sync, args.high, args.low, args.code);
        })
  }

  async getConnectionForDevice(device, { retry = true, settings = null } = {}) {
    const { mqttHost, mqttPort, mqttUser, mqttPassword } = settings || device.getSettings();
    let conn = await this.getConnection(mqttHost, mqttPort, mqttUser, mqttPassword, retry);
    return conn.registerDevice(device.getTopic());
  }

  async getConnection(host, port, username, password, retry = true) {
    let key = [ host, port, username, password ].join('\x00');
    let prefix = 'reusing';
    if (! this.connections[key]) {
      prefix = 'creating new';
      let client = new SonoffTasmotaMqtt(host, { port, username, password });
      this.connections[key] = client.connect({ retry }); // store the promise
    }
    this.log(prefix + ` MQTT connection to ${ host }:${ port }`);
    return await this.connections[key];
  }

  onPair(socket) {
    let conn, mqttCredentials;

    socket.on('pair.init', (data, callback) => {
      return callback(null, {
        mqttHost     : Homey.env.MQTT_HOST,
        mqttPort     : Homey.env.MQTT_PORT,
        mqttUser     : Homey.env.MQTT_USER,
        mqttPassword : Homey.env.MQTT_PASSWORD,
      });
    }).on('mqtt.test', async (data, callback) => {
      this.log(`testing MQTT broker @ ${ data.mqttHost }:${ data.mqttPort }`);
      let err = null;

      try {
        let { mqttHost, mqttPort, mqttUser, mqttPassword } = data;
        let client = new SonoffTasmotaMqtt(mqttHost, {
          port     : mqttPort,
          username : mqttUser,
          password : mqttPassword
        });
        conn = await client.connect({ retry : false });
        mqttCredentials = Object.assign({}, data);
        this.log('connection successful');
      } catch(e) {
        this.log('connection failed', e.message);
        err = { message : e.message };
      }
      return callback(err);
    }).on('device.list', async (data, callback) => {
      if (! conn) {
        return callback({ message : 'invalid pairing sequence' });
      }
      this.log('waiting for new device...');
      let device = conn.registerAnyDevice();

      // Wait for INFO1
      let info1 = await device.waitFor('info1');

      // Wait for STATUS5 (network status)
      let status5 = await device.sendCommand('status', '5').waitFor('status5');

      // Use device MAC as unique identifier.
      let id = status5.StatusNET.Mac;
      this.log('found device with id', id);

      // Check if we've already paired with this device.
      if (! (this.getDevice({ id }) instanceof Error)) {
        this.log('device is already paired');
        conn.unregisterAnyDevice();
        return callback(null, []);
      }
      this.log('device is not yet paired');

      // Build a list of capabilities that the device supports.
      let capabilities = [];
      if (await device.hasPowerSupport()) {
        capabilities.push('onoff');
      }
      if (await device.hasRfSupport()) {
        capabilities.push('rf_transmit');
        capabilities.push('rf_receive');
      }
      if (await device.hasPowerMonitorSupport()) {
        capabilities.push('meter_power');
      }
      if (await device.hasColorSupport()) {
        capabilities.push('light_hue');
        capabilities.push('light_saturation');
      }
      if (await device.hasColorTemperatureSupport()) {
        capabilities.push('light_temperature');
      }
      if (await device.hasDimmerSupport()) {
        capabilities.push('dim');
      }
      this.log('detected device capabilities:', capabilities.join(', '));

      // Determine name for device (based on its MQTT topic).
      let name = device.getTopic();

      // Unregister listeners.
      conn.unregisterAnyDevice();

      // Return the device data to the frontend.
      return callback(null, [{
        name  : name,
        class : capabilities.includes('onoff') ? 'socket' : 'other',
        data  : { id },
        store : {
          module  : info1.Module,
          version : info1.Version,
        },
        settings : {
          topic         : name,
          fallbackTopic : info1.FallbackTopic,
          groupTopic    : info1.GroupTopic,
          powerOnState  : constants.POWER_ON_STATE_SAVED,
          ledState      : constants.LED_STATE_OFF,
          ...mqttCredentials
        },
        capabilities
      }]);
    }).on('error', err => {
      this.log('pairing socket error', err);
      conn && conn.end();
    }).on('disconnect', () => {
      // Called when pairing dialog is closed.
      conn && conn.end();
    });
  }

  triggerRfReceive(device, tokens, state) {
    // Trigger "RF Received" flow
    this.flowTriggerRfReceive.trigger(device, tokens, state).catch(e => {
      this.log('flowTriggerRfReceive error', e);
    });

    // Emit realtime event (used in the RF sniffer in the app settings).
    Homey.ManagerApi.realtime('rf.receive', Object.assign({
      timestamp : new Date(),
      device    : {
        id   : device.getData().id,
        name : device.getName(),
      },
    }, tokens));
  }
}
