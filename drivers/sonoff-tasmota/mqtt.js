const mqtt      = require('mqtt');
const { delay } = require('./utils');

module.exports.connect = (host, port, user, password, options) => {
  return new Promise((resolve, reject) => {
    // Default options.
    options = Object.assign({
      retries         : 0,
      retryInterval   : 1000,
      timeout         : 10000,
      reconnectPeriod : 1000,
    }, options);

    // Try connecting.
    let client = mqtt.connect({
      host            : host,
      port            : port,
      user            : user     || undefined,
      password        : password || undefined,
      connectTimeout  : options.timeout,
      reconnectPeriod : options.reconnectPeriod,
    });
    client.once('connect', () => {
      resolve(client);
    }).once('error', err => {
      client.end();
      reject(err);
    }).once('offline', () => {
      client.end();

      // Retry?
      if (options.retries > 0) {
        return delay(options.retryInterval).then(() => {
          console.log('retrying MQTT broker,', options.retries, 'tries left');
          options.retries--;
          return module.exports.connect(host, port, user, password, options);
        });
      }

      // Give up.
      reject(new Error('CONNECTION_FAILED'));
    });
  });
};
