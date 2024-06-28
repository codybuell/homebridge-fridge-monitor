Homebridge Fridge Monitor
=========================

A [homebridge](https://github.com/homebridge/homebridge) plugin to expose a web-based fridge monitor to Apple's [HomeKit](http://www.apple.com/ios/home/). Using HTTP requests, the plugin allows you to read temperatures and door contact sensors from remote servers and define alert thresholds. This project was built to be used with [picow-fridge-monitor](https://github.com/codybuell/picow-fridge-monitor) but can support any other device where the output can be configured to the desired json format.

Installation
------------

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-fridge-monitor`
3. Update the accessory section of your `config.json`

    ```jsonc
    {
      "accessory": "HttpFridgeMonitor",         // fixed accessory name, do not change
      "name": "Basement Freezer",               // name of sensor
      "url": "http://192.168.1.10/freezer",     // url to query
      "alertTemperature": 0,                    // temp at or above to alert on (celcius)
      "alertThreshold": 3,                      // number of reads above alert temp before alerting
      "updateInterval": 30000                   // milliseconds, defaults to 60000
    }
    ```

Alternatively, if you are using the Homebridge UI, search for `homebridge-fridge-monitor`, install, then edit the plugin config to add your devices.

Device Support
--------------

If you want to build your own device for a few dollars consider the [picow-fridge-monitor](https://github.com/codybuell/picow-fridge-monitor). Otherwise ensure your device responds with the following JSON when queried:

```json
{
  "temp_f": 79.36,
  "temp_c": 26.31,
  "door_open": false
}
```
