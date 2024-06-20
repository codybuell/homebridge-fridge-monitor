const http = require('http');
let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('HttpTemperatureMonitor', HttpTemperatureMonitor);
};

class HttpTemperatureMonitor {
  constructor(log, config) {
    // pull bits into class
    this.log = log;
    this.config = config;

    // stub initial values
    this.temperature = 20;
    this.temperatureCount = 0;
    this.alertState = Characteristic.LeakDetected.LEAK_NOT_DETECTED

    // grab configuration
    this.name = config.name;
    this.url = config.url;
    this.updateInterval = config.updateInterval || 60000;
    this.alertTemperature = config.alertTemperature;
    this.alertThreshold = config.alertThreshold;

    // initialize temperature service
    this.temperatureService = new Service.TemperatureSensor(this.name);

    // set current temperature characteristic
    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));

    // set temperature display units characteristic
    this.temperatureService
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .setValue(Characteristic.TemperatureDisplayUnits.FAHRENHEIT);

    // initialize the alert service
    this.alertService = new Service.LeakSensor(this.name + ' Alert');
    this.alertService.getCharacteristic(Characteristic.LeakDetected)
      .on('get', this.getAlertState.bind(this));

    // log startup
    this.log.info('HttpTemperatureMonitor Plugin Loaded');

    // fetch initial values and schedule periodic updates
    this.fetchData();
    setInterval(this.fetchData.bind(this), this.updateInterval);
  }

  async fetchData() {
    http.get(this.url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // grab the current temperature
        this.temperature = JSON.parse(data).temp_c;

        // update the temperature service
        this.temperatureService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(this.temperature);

        // check for alarm status
        this.checkTemperature(this.temperature);
      });

      // log the current temperature
      this.log.debug('Current temp: %s', this.temperature);

    }).on('error', (err) => {
      this.log.warn('Error: ' + err.message);
    });
  }

  checkTemperature(temperature) {
    if (temperature >= this.alertTemperature) {
      this.log.info('Temperature above limit')
      // increment our count and alert if past threshold
      this.temperatureCount++;
      if (this.temperatureCount >= this.alertThreshold) {
        this.triggerAlert();
      }
    } else {
      // reset the alert state when the temperature goes below the threshold
      this.temperatureCount = 0;
      this.alertState = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
      this.alertService.getCharacteristic(Characteristic.LeakDetected)
        .updateValue(this.alertState);
    }
  }

  triggerAlert() {
    // create a new leaksensor service if it doesn't exist
    if (!this.alertService) {
      this.alertService = new Service.LeakSensor(this.name + ' Alert');
      this.alertService.getCharacteristic(Characteristic.LeakDetected)
        .on('get', this.getAlertState.bind(this));
    }

    // trigger the alert
    this.alertState = Characteristic.LeakDetected.LEAK_DETECTED;
    this.alertService.getCharacteristic(Characteristic.LeakDetected)
      .updateValue(this.alertState);

    this.log.info('Alert triggered!');
  }

  getTemperature(callback) {
    callback(null, this.temperature);
  }

  getAlertState(callback) {
    callback(null, this.alertState);
  }

  getServices() {
    return [
      this.temperatureService,
      this.alertService,
    ];
  }
}
