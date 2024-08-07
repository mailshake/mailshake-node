'use strict';
const Promise = require('es6-promise');

// NOTE: Use a new instance for each request
class Response {
  // error;
  // result;
  // rawResponseText
  // requestArgs;
  // config;
  // requestUrl;

  constructor (requestUrl, requestArgs, config) {
    this.requestArgs = requestArgs || {};
    this.requestUrl = requestUrl;
    this.config = config;
    this.config.validate();
  }

  parse (err, rawResponseText, statusCode) {
    this.rawResponseText = rawResponseText;
    if (err) {
      this.error = err;
      throw err;
    }

    if (!statusCode) {
      statusCode = 'Unknown Status Code';
    }

    if (!rawResponseText) {
      this.error = new Error('Received empty response from server');
      throw this.error;
    }

    let result;
    try {
      result = JSON.parse(rawResponseText);
      if (result.error) {
        this.error = new Error(result.error);
        this.error.code = result.code;
        this.error.time = result.time;
        throw this.error;
      }
    } catch (ex) {
      this.error = new Error(`Received unexpected ${statusCode} response from server: "${rawResponseText}"`);
      throw this.error;
    }

    this.attachPagingFunction(result);
    this.result = result;
    return result;
  }

  attachPagingFunction (result) {
    if (typeof (result.nextToken) === 'undefined') {
      return;
    }
    result.next = () => {
      if (!result.nextToken) {
        return Promise.resolve({
          nextToken: null,
          results: []
        });
      }
      const Request = require('./request').Request;
      const request = new Request(this.config);
      this.requestArgs.nextToken = result.nextToken;
      return request.executeRaw(this.requestUrl, this.requestArgs);
    };
  }
}

module.exports.Response = Response;
