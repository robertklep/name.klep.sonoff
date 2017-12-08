const syslog     = require('syslog-client');
const { format } = require('util');

// Check and see if we're running on Homey.
try {
  var Homey = require('homey');
} catch(e) {
  throw Error('needs to run on Homey');
}

module.exports = (host = Homey.env.SYSLOG_HOST, opts = {}) => {
  let port      = opts.port || Homey.env.SYSLOG_PORT || 514;
  let transport = opts.transport === 'tcp' ? syslog.Transport.Tcp : syslog.Transport.Udp;

  if (host == null || port == null) {
    throw Error('missing syslog host/port');
  }

  // Instantiate syslog client.
  let client = syslog.createClient(host, { port, transport }).on('error', e => {
    console.error('syslog error', e.message);
  });

  // Monkeypatch Homey.
  let log = console.log;
  console.log = function(...args) {
    client.log(format(...args));
    return log.apply(this, arguments);
  }
};
