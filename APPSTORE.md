# Sonoff

Control ITEAD Sonoff WiFi devices using Homey.

### Introduction

This driver works with unmodified Sonoff WiFi devices, using the original firmware (however, see below).

However, it does require an initial device setup. The procedure for this is documented in [`README.md`](https://github.com/robertklep/name.klep.sonoff#readme), and you can also read it during the device pairing phase on Homey.

It does not require the Sonoff/eWeLink app on your mobile. Once the device has been set up, it will also not use the Sonoff/eWeLink Chinese cloud (instead, it will use Homey as its cloud server).

Be aware that as long as the device is associated with Homey, you can't use it with the eWeLink app anymore. To revert back to using the eWeLink app, re-pair the device with the app.

### New Sonoff Firmware may break this app's functionality!

Recently, new Sonoff firmware updates have been released that prevent this app from working. This means two things:

* Newer, or recently purchased, devices may not work with this app at all.
* If you have an older device, but update its firmware through the eWeLink app, it may not be possible to get the device working with Homey anymore.

As of yet, there is no solution to this problem. Other projects that work in a similar way, like [SonOTA](https://github.com/mirko/SonOTA/issues/87), are also faced with this problem.

### Tested devices

This driver has been tested with the following devices:

* Sonoff Basic WiFi Wireless Switch
* Sonoff S20 Smart Socket
* Sonoff RF WiFi Wireless Smart Switch With RF Receiver
* Sonoff Slampher

For now, only switching the device on/off is supported (no timers or temperature/humidity/power usage sensors).

### Issues

Please report issues here: https://github.com/robertklep/name.klep.sonoff/issues

### Changelog

1.2.0 (2017-12-16):
- Improved pairing
- Using icon set kindly provided by Ivo Derksen

1.1.0 (2017-12-09):
- Rewritten device manager
- Added device watchdog to faster catch devices that went offline
- Added syslog support as development aid
- Faster pairing in certain situations

1.0.0 (2017-12-01):
- Initial beta release
