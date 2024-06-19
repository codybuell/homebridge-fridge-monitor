Homebridge Temperature Monitor
==============================

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based temperature sensor to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to read temperatures and define alert thresholds.

Installation
------------

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-temperature-monitor`
3. Update your `config.json`

    ```jsonc
    {
      "accessory": "HttpTemperatureMonitor",    // fixed accessory name, do not change
      "name": "Basement Freezer",               // name of sensor
      "url": "http://192.168.1.50",             // url to query
      "alertTemperature": 25,                   // temp at or above to alert on (celcius)
      "alertThreshold": 3,                      // number of reads above alert temp before alerting
      "updateInterval": 30000                   // milliseconds, defaults to 60000
    }
    ```

Device Support
--------------

Currently this plugin requires the temperature server to respond with json in the following format.

```json
{
  "temp_f": "79.36",
  "temp_c": "26.31"
}
```
