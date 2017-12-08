# homey-syslog

A simple library to enable [Homey](https://www.athom.com/) apps to log to a remote syslog server.

This library patches the built-in Homey logging code so anything that gets logged will _also_ be logged to the syslog server.

## Installation

```
$ npm i homey-syslog
```

## Usage

In your apps `app.js`:
```
require('homey-syslog')([ SYSLOG_SERVER ][, opts]);
```

`SYSLOG_SERVER` is the name or IP-address of your syslog server.

It's optional iff you provide `Homey.env.SYSLOG_HOST`, i.e. if you have a file `env.json` that defines it:

```
{ "SYSLOG_HOST" : "11.22.33.44" }
```

Valid options:
* `port` : TCP/UDP port for the syslog server. Defaults to `Homey.env.SYSLOG_PORT`, or `514` otherwise.
* `transport`: either `tcp` or `udp` (the default)

## Example

```
require('homey-syslog')('192.168.1.123', {
  port      : 514,
  transport : 'tcp'
});
```

## DON'T USE IN PRODUCTION CODE

The purpose of this library is to aid during development of Homey apps, it's not intended to be used for apps in production.

An option could be to explicitly set a `DEBUG` environment variable in `env.json`, and only load this library that that variable evaluates to true:
```
if (Homey.env.DEBUG === 'true') {
  require('homey-syslog')(...);
}
```
