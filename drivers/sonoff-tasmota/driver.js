const Homey     = require('homey');
const mqtt      = require('./mqtt');
const constants = require('./constants');

module.exports = class SonoffTasmotaDriver extends Homey.Driver {
  async onInit() {
    this.log('[init]');
  }

  onPair(socket) {
    let client, mqttCredentials;

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
        client          = await mqtt.connect(data.mqttHost, data.mqttPort, data.mqttUser, data.mqttPassword);
        mqttCredentials = Object.assign({}, data);
        this.log('connection successful');
      } catch(e) {
        this.log('connection failed', e.message);
        err = { message : e.message };
      }
      return callback(err);
    }).on('device.list', async (data, callback) => {
      if (! client) {
        return callback({ message : 'invalid pairing sequence' });
      }
      let status5 = null, info1 = null;
      client.subscribe('tele/+/INFO1').subscribe('stat/+/STATUS5').on('message', (topic, message) => {
        let [ prefix, name, cmnd ] = topic.split('/');

        // Message payload should be JSON
        try {
          message = JSON.parse(message);
        } catch(e) {
          client.unsubscribe('#');
          return callback(new Error('INVALID_DATA'));
        }

        // Store payload.
        if (cmnd === 'INFO1') {
          info1 = message;
          // Solicit a `STATUS5` response.
          client.publish(`cmnd/${ name }/status`, '5');
        } else {
          status5 = message;
        }

        // Got both required messages.
        if (status5 && info1) {
          // Not interested in any messages anymore.
          client.unsubscribe('#');

          // Use device MAC as unique identifier.
          let id = status5.StatusNET.Mac;

          // Check if we've already paired with this device.
          let device = this.getDevice({ id });
          if (! (device instanceof Error)) {
            return callback(null, []);
          }

          // Return the device data to the frontend.
          return callback(null, [{
            name  : name,
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
            }
          }]);
        }
      });
    }).on('device.identify', async (device, callback) => {
      if (! client) {
        return callback({ message : 'invalid pairing sequence' });
      }
      this.switchDevice(client, device.settings.topic, true);
      setTimeout(() => {
        this.switchDevice(client, device.settings.topic, false);
        return callback();
      }, 1000);
    }).on('error', err => {
      this.log('pairing socket error', err);
      client && client.end();
    }).on('disconnect', () => {
      // Called when pairing dialog is closed.
      client && client.end();
    });
  }

  switchDevice(client, topic, state) {
    client.publish(`cmnd/${ topic }/power`, state ? 'on' : 'off');
  }

  onDeleted(device) {
    this.log('[driver] on added', device);
  }

  onAdded(device) {
    this.log('[driver] on added', device);
  }
}
