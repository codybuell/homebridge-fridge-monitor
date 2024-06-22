const http = require('http');
let Service, Characteristic;

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('HttpFridgeMonitor', HttpFridgeMonitor);
};

class HttpFridgeMonitor {
  constructor(log, config) {
    // pull bits into class
    this.log = log;
    this.config = config;

    // stub initial values
    this.temperature = 20;
    this.temperatureCount = 0;
    this.alertState = Characteristic.LeakDetected.LEAK_NOT_DETECTED
    this.contactState = Characteristic.ContactSensorState.CONTACT_DETECTED;

    // grab configuration
    this.name = config.name;
    this.url = config.url;
    this.updateInterval = config.updateInterval || 60000;
    this.alertTemperature = config.alertTemperature;
    this.alertThreshold = config.alertThreshold;

    // initialize temperature service
    this.temperatureService = new Service.TemperatureSensor(this.name);
    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));
    this.temperatureService
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .setValue(Characteristic.TemperatureDisplayUnits.FAHRENHEIT);

    // initialize the information service
    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, 'HttpFridgeMonitor')
      .setCharacteristic(Characteristic.Model, 'HttpFridgeMonitor')
      .setCharacteristic(Characteristic.SerialNumber, 'N/A');

    // initialize the alert service (leak sensor)
    this.alertService = new Service.LeakSensor(this.name + ' Alert');
    this.alertService.getCharacteristic(Characteristic.LeakDetected)
      .on('get', this.getAlertState.bind(this));

    // initial the contact sensor
    this.contactService = new Service.ContactSensor(this.name + ' Door');
    this.contactService
      .getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this.getContactState.bind(this));

    // log startup
    this.log.info('HttpFridgeMonitor Plugin Loaded');

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
        state = JSON.parse(data);
        // grab the current temperature
        this.temperature = state.temp_c;

        // update the temperature service
        this.temperatureService
          .getCharacteristic(Characteristic.CurrentTemperature)
          .updateValue(this.temperature);

        // check for alarm status
        this.checkTemperature(this.temperature);

        // update the contact sensor
        this.contactState = state.door_open
          ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
          : Characteristic.ContactSensorState.CONTACT_DETECTED;
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
      this.temperatureCount = 0;
      // reset the alert state when the temperature goes below the threshold
      if (this.alertState == Characteristic.LeakDetected.LEAK_DETECTED) {
        this.alertState = Characteristic.LeakDetected.LEAK_NOT_DETECTED;
        this.alertService.getCharacteristic(Characteristic.LeakDetected)
          .updateValue(this.alertState);
        this.log.info('Temperature alert reset')
      }
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

  getContactState(callback) {
    callback(null, this.contactState);
  }

  getServices() {
    return [
      this.temperatureService,
      this.alertService,
      this.informationService,
      this.contactService,
    ];
  }
}
