const SENSORDATA = require('./sensors.json');
const Units      = require('./units');
const isObject   = x => typeof x === 'object' && x !== null;

// Build a mobile card from a list of capabilities.
module.exports.generateMobileCard = function generateMobileCard(capabilities) {
  let components = [ { id : 'icon', capabilities : [] } ];
  let sensors = null;
  let colors  = null;
  for (let cap of capabilities) {
    if (cap.startsWith('onoff')) {
      components.push({ id : 'toggle', capabilities : [ cap ], options : { showTitle : true } });
    } else if (cap.startsWith('pwm')) {
      components.push({ id : 'slider', capabilities : [ cap ], options : { showTitle : true } });
    } else if (cap.startsWith('measure_battery')) {
      components.push({ id : 'battery', capabilities : [ cap ], options : { showTitle : true } });
    } else if (cap.startsWith('measure_') || cap === 'last_update_timestamp') {
      if (! sensors) {
        sensors = { id : 'sensor', capabilities : [], options : { showTitle : true, icons : {} } };
        components.push(sensors);
      }
      sensors.capabilities.push(cap);
      if (cap === 'last_update_timestamp') {
        sensors.options.icons.last_update_timestamp = 'assets/mobile/last_update_timestamp.svg';
      }
    } else if (cap.startsWith('light_') || cap === 'dim') {
      if (! colors) {
        colors = { id : 'color', capabilities : [], options : { showTitle : true, icons : {} } };
        components.push(colors);
      }
      colors.capabilities.push(cap);
    }
  }
  return { components };
};

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
