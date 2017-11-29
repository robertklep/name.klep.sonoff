# Sonoff

Control Sonoff WiFi devices using Homey.

##### Initial device setup

This driver works with Sonoff WiFi devices that run the original Sonoff firmware. The hardware setup mimics the Sonoff _eWelink_ mobile app by tricking the device into using the Homey as its cloud server. Once the hardware setup is complete, the device will not be using the Chinese cloud service, but your Homey.

The initial device setup cannot be performed from Homey, and requires a computer that can connect to WiFi networks. The Sonoff app for Homey should already be running.

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
curl --data-binary @pair.json -XPOST -H 'content-type: application/json' http://10.10.7.1/ap
```

(this requires the `curl` tool to be installed).

The response should be `{"error":0}`

After this, the device should announce itself to the Homey, and is ready to be paired with it.

##### Pairing

When pairing a device, it works best to unplug the device until the Homey driver starts looking for it. When you plug in the device at that point, it should get discovered quite quickly.

##### Remarks

When the device has lost its connection to Homey, it may take some time (a minute or 2) before it connects again. The Homey cannot force a connection, it has to wait for the device to contact it before it can be used.
