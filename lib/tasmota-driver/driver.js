const Homey             = require('homey');
const SonoffTasmotaMqtt = require('sonoff-tasmota-mqtt');
const constants         = require('./constants');

// App-global list of connections.
let connections = {};

module.exports = class SonoffTasmotaDriver extends Homey.Driver {

  async onInit() {
    this.log('[init]');
  }

  async getConnectionForDevice(device, { retry = true, settings = null } = {}) {
    const { mqttHost, mqttPort, mqttUser, mqttPassword } = settings || device.getSettings();
    let conn = await this.getConnection(mqttHost, mqttPort, mqttUser, mqttPassword, retry);
    return conn.registerDevice(device.getTopic());
  }

  async getConnection(host, port, username, password, retry = true) {
    let key = [ host, port, username, password ].join('\x00');
    let prefix = 'reusing';
    if (! connections[key]) {
      prefix = 'creating new';
      let client = new SonoffTasmotaMqtt(host, { port, username, password });
      connections[key] = client.connect({ retry }); // store the promise
    }
    this.log(prefix + ` MQTT connection to ${ host }:${ port }`);
    return await connections[key];
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
      this.log('found device with id', id, ` (module ${ info1.Module })`);

      // Check if module is supported by this driver.
      if (! this.supportedModules().includes(info1.Module)) {
        this.log('device module not supported for this driver');
        return callback(null, []);
      }

      // Check if we've already paired with this device.
      if (! (this.getDevice({ id }) instanceof Error)) {
        this.log('device is already paired');
        conn.unregisterAnyDevice();
        return callback(null, []);
      }
      this.log('device is not yet paired');

      // Build a list of capabilities that the device supports.
      let capabilities = this.supportedCapabilities();
      if (capabilities.length === 0) {
        this.log('device supports no capabilities?');
        return callback(null, []);
      }
      this.log('device capabilities:', capabilities.join(', '));

      // Determine name for device (based on its MQTT topic).
      let name = device.getTopic();

      // Unregister listeners.
      conn.unregisterAnyDevice();

      // Return the device data to the frontend.
      return callback(null, [
        this.configureNewDevice({
          name  : name,
          class : capabilities.some(c => c.startsWith('onoff')) ? 'socket' : 'other',
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
        })
      ]);
    }).on('error', err => {
      this.log('pairing socket error', err);
      conn && conn.end();
    }).on('disconnect', () => {
      // Called when pairing dialog is closed.
      conn && conn.end();
    });
  }

  registerFlowAction(action) {
    return new Homey.FlowCardAction(action).register().registerRunListener(( args, state ) => {
      if (! args.device.onFlowAction) return Promise.reject(Error(`device can't handle flow actions`));
      return args.device.onFlowAction(action, args, state);
    });
  }

  supportedModules() {
    return [];
  }

  supportedCapabilities() {
    return [];
  }

  configureNewDevice(d) {
    return d;
  }

}
