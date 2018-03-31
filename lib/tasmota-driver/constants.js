module.exports = {
  POWER_ON_STATE_OFF       : '0', // Keep relay(s) off after power on
  POWER_ON_STATE_ON        : '1', // Turn relay(s) on after power on
  POWER_ON_STATE_TOGGLE    : '2', // Toggle relay(s) on from last saved
  POWER_ON_STATE_SAVED     : '3', // (default) Turn relay(s) on as last saved
  POWER_ON_STATE_ON_FIXED  : '4', // Turn relay(s) on and disable further relay control

  LED_STATE_OFF            : '0',
  LED_STATE_ON             : '1', // Show power state
  LED_STATE_MQTT_SUB       : '2', // Show MQTT subscriptions as a led blink
  LED_STATE_POWER_MQTT_SUB : '3', // Show power state and MQTT subscriptions as a led blink
  LED_STATE_MQTT_PUB       : '4', // Show MQTT publications as a led blink
  LED_STATE_POWER_MQTT_PUB : '5', // Show power state and MQTT publications as a led blink
  LED_STATE_MQTT_ALL       : '6', // Show all MQTT messages as a led blink
  LED_STATE_POWER_MQTT_ALL : '7', // Show power state and MQTT messages as a led blink
};
