# Sonoff

Control ITEAD Sonoff WiFi devices using Homey.

### DEPRECATED

Because I stopped using Homey, I can no longer properly support this app, which means I won't be implementing new features or bugfixes.

If another developer wants to assume responsibility for further development of this app, feel free to contact me.

#### Initial device setup (original firmware)

This driver works with Sonoff WiFi devices that run the original Sonoff firmware. The hardware setup mimics the Sonoff _eWelink_ mobile app by tricking the device into using the Homey as its cloud server. Once the hardware setup is complete, the device will not be using the Chinese cloud service, but your Homey.

**NOTICE**: *more recent Sonoff firmware versions don't allow this method anymore. The setup procedure may seem to work, but the device will never contact the Homey Sonoff app properly. There is no known workaround at this moment.*

*The only alternative is to use an alternative (unofficial) firmware. At the moment, [Sonoff-Tasmota](https://github.com/arendst/Sonoff-Tasmota/) is supported. However, installing an alternative firmware requires you to open up the device (voiding its warranty), soldering connectors to it, and flashing the firmware using a USB-to-serial dongle.*

###### Device setup from Homey desktop app

The initial device setup can be performed from the Homey desktop app. Follow the instructions when creating a new device. This requires that the computer running the Homey desktop app can connect to WiFi network.

###### Device setup from terminal/command line

If the device setup from the Homey desktop app doesn't work, there's an alternative method that requires a terminal, command line, or "shell". The Sonoff app for Homey should already be running.

First, prepare a file called `pair.json`, that contains the following:
```
{
  "version": 4,
  "ssid": "WIFI NETWORK NAME",
  "password": "WIFI PASSWORD",
  "serverName": "HOMEY IP ADDRESS",
  "port": 8305
}
```

Replace `WIFI NETWORK NAME`, `WIFI PASSWORD` and `HOMEY IP ADDRESS` with the correct values.

Next, put the Sonoff device in discovery mode, by pressing its button for about 5 seconds, until the green LED starts flashing quickly.

This should put the device in WiFi-AP mode, meaning it will provide a WiFi network with a name that starts with _ITEAD-10000_. Connect to this WiFi network. When asked for a password, enter _12345678_

When your computer has successfully connected, you should open a terminal or command line prompt and execute the following command from the same directory where the `pair.json` file was stored:
```
curl --data-ascii @pair.json -XPOST -H "content-type: application/json" http://10.10.7.1/ap
```

(this requires the `curl` tool to be installed).

The response should be `{"error":0}`. If it doesn't work, try `--data-binary` instead of `--data-ascii`.

After this, the device should announce itself to the Homey, and is ready to be paired with it.

##### Pairing

When pairing a device, it works best to unplug the device until the Homey driver starts looking for it. When you plug in the device at that point, it should get discovered quite quickly.

##### Remarks

When the device has lost its connection to Homey, it may take some time (a minute or 2) before it connects again. The Homey cannot force a connection, it has to wait for the device to contact it before it can be used.

#### Sonoff-Tasmota firmware

This driver also supports devices that are using the [Sonoff-Tasmota](https://github.com/arendst/Sonoff-Tasmota/) firmware (how to install this firmware is beyond the scope of this document).

For now, the only supported communication protocol is MQTT, which requires a separate _MQTT broker_. The Homey [MQTT Broker](https://apps.athom.com/app/nl.scanno.mqttbroker) app, which runs an MQTT broker on Homey itself, will work just fine.

Pairing the device should be self-explanatory.

### OMGWTFBBQ YOU COMMITTED TLS PRIVATE KEYS

Yes, I know. I don't consider it to be a security risk.
