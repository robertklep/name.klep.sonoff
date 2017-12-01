# Sonoff

Control ITEAD Sonoff WiFi devices using Homey.

### Introduction

This driver works with unmodified Sonoff WiFi devices, using the original firmware.

However, it does require an initial device setup. The procedure for this is documented in `README.md`, and you can also read it during the device pairing phase on Homey.

It does not require the Sonoff/eWeLink app on your mobile. Once the device has been set up, it will also not use the Sonoff/eWeLink Chinese cloud (instead, it will use Homey as its cloud server).

### Tested devices

This driver has been tested with the following devices:

* Sonoff Basic WiFi Wireless Switch
* Sonoff S20 Smart Socket

For now, only switching the device on/off is supported (no timers or temperature/humidity/power usage sensors).