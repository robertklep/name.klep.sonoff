const SENSORDATA = require('./sensors.json');
const Units      = require('./units.js');
const isObject   = x => typeof x === 'object' && x !== null;

// Mapping of Tasmota sensors to Homey capabilities.
module.exports.capabilitiesForSensor = function capabilitiesForSensor(sensor) {
  let data = SENSORDATA[sensor];
  return data ? Object.keys(data.capabilities) : [];
};

// Convert Tasmota sensor data to something Homey can work with.
module.exports.sensorDataToHomey = function sensorDataToHomey(data) {
  if (! isObject(data)) return {};
  return Object.keys(data).reduce((acc, sensorName) => {
    let sensorData = data[sensorName];

    // Convert scalar values to an object.
    if (! isObject(sensorData)) {
      sensorData = { [ sensorName ] : sensorData };
    }

    for (let unit of Object.keys(sensorData)) {
      Object.assign(acc, Units.tasmotaToHomey(unit, sensorData[unit]));
    }
    return acc;
  }, {});
};

// Convert Homey capabilities to a Tasmota command and value.
module.exports.homeyToCommand = function homeyToCommand(capability, value) {
};
