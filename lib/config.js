'use strict';
class Config {
  // baseUrl;
  // apiKey;
  // customizeRequest (options: any) => any
  // overrideCreateRequest (options: any, callbackFn: (res => void)) => any

  constructor (arg1, arg2) {
    this.baseUrl = `https://api.mailshake.com/2017-04-01`;
    if (typeof (arg1) === 'string') {
      this.apiKey = arg1;
      this.init(arg2);
    } else {
      this.init(arg1);
    }
  }

  init (props) {
    props = props || {};
    Object.keys(props).forEach((key) => {
      this[key] = props[key];
    });
  }

  validate () {
    if (!this.baseUrl) {
      throw new Error(`Missing baseUrl in configuration`);
    }
    if (!this.apiKey) {
      throw new Error(`Missing apiKey in configuration`);
    }
  }
}

module.exports.Config = Config;
