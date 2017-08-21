'use strict';
let Promise = require('es6-promise');

// NOTE: Use a new instance for each request
class Response {
  // rawRequest;
  // error;
  // result;
  // rawResponseText

  constructor(rawRequest) {
    this.rawRequest = rawRequest;
  }

  parse(err, rawResponseText) {
    this.rawResponseText = rawResponseText;
    if (err) {
      this.error = err;
      throw err;
    }
    let result = JSON.parse(rawResponseText);
    if (result.error) {
      this.error = new Error(result.error);
      this.error.code = result.code;
      this.error.time = result.time;
      throw this.error;
    }
    return result;
    // todo: we could store `nextToken` and make it easy to execute the next paginated request
  }
}

module.exports.Response = Response;
