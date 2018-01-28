const mqtt = require('mqtt');

module.exports.connect = (host, port, user, password, timeout) => {
  return new Promise((resolve, reject) => {
    let client = mqtt.connect({
      host           : host,
      port           : port,
      user           : user     || undefined,
      password       : password || undefined,
      connectTimeout : timeout || 10000,
    });
    client.once('connect', () => {
      resolve(client);
    }).once('error', err => {
      client.end();
      reject(err);
    }).once('offline', () => {
      client.end();
      reject(new Error('CONNECTION_FAILED'));
    });
  });
};
