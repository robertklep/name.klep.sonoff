const mappings = module.exports = {
  // Map Tasmota to Homey capabilities.
  TASMOTA_TO_HOMEY: {
    "Temperature":   value => ({ "measure_temperature": value }),
    "Humidity":      value => ({ "measure_humidity":    value }),
    "Pressure":      value => ({ "measure_pressure":    value }),
    "Illuminance":   value => ({ "measure_luminance":   value }),
    "Gas":           value => ({ "measure_voc":         value }),
    "UvLevel":       value => ({ "measure_ultraviolet": value }),
    "Voltage":       value => ({ "measure_voltage":     value }),
    "Current":       value => ({ "measure_current":     value }),
    "Power":         value => ({ "measure_power":       value }),
    "CarbonDioxide": value => ({ "measure_co2":         value }),
    "PM2.5":         value => ({ "measure_pm25":        value }),
    "CO":            value => ({ "measure_co":          value }),
    "Distance":      value => ({ "measure_distance":    value }),
    "Hue":           value => ({ "light_hue":           value / 360.0 }),
    "Saturation":    value => ({ "light_saturation":    value / 100.0 }),
    "Brightness":    value => ({ "dim":                 value / 100.0 }),
    "HSBColor":      value => {
      let [ Hue, Saturation, Brightness ] = value.split(',');
      return {
        light_hue:        Hue        / 360.0,
        light_saturation: Saturation / 100.0,
        dim:              Brightness / 100.0
      };
    },
  },
  tasmotaToHomey : (name, value) => {
    let mapper = mappings.TASMOTA_TO_HOMEY[name];
    return mapper ? mapper(value) : null;
  }
};
