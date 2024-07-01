'use strict';
const Promise = require('es6-promise');
const http = require('http');
const https = require('https');
const url = require('url');
const promiseRetry = require('promise-retry');
const Response = require('./response').Response;
const Buffer = require('safe-buffer').Buffer;

const MAX_ATTEMPTS = 3;
const MS_DELAY = 500;

// NOTE: Use a new instance for each request
class Request {
  // requestOptions;
  // body;
  // config;
  // response;

  constructor (config) {
    this.config = config;
    this.config.validate();
  }

  get transport () {
    if (!this.requestOptions) {
      return null;
    }
    return this.requestOptions.protocol === 'http:' ? http : https;
  }

  execute (path, args) {
    const fullUrl = `${this.config.baseUrl}/${path}`;
    return this.executeRaw(fullUrl, args);
  }

  executeRaw (fullUrl, args) {
    this.prepare(fullUrl, args);
    this.addAuthentication();
    if (this.config.customizeRequest) {
      this.requestOptions = this.config.customizeRequest(this.requestOptions);
    }
    this.response = new Response(fullUrl, args, this.config);
    return this.createRawRequest()
      .then(({ raw, statusCode }) => this.response.parse(null, raw, statusCode))
      .catch(err => {
        if (!this.response) {
          this.response = new Response(null);
        }
        return this.response.parse(err, null, err.statusCode);
      });
  }

  createRawRequest () {
    return new Promise((resolve, reject) => {
      const req = this.initiateRawRequest(res => {
        return promiseRetry((retry) => {
          return this.handleResponse(res).catch(retry);
        }, {
          retries: MAX_ATTEMPTS,
          minTimeout: MS_DELAY
        }).then(resolve, reject);
      });

      req.on('error', reject);
      req.write(this.body);
      req.end();
    });
  }

  initiateRawRequest (callbackFn) {
    if (this.config.overrideCreateRequest) {
      return this.config.overrideCreateRequest(this.requestOptions, callbackFn);
    }
    return this.transport.request(this.requestOptions, callbackFn);
  }

  prepare (fullUrl, args) {
    this.requestOptions = url.parse(fullUrl);
    this.body = JSON.stringify(args || {});
    this.requestOptions.method = 'POST';
    this.requestOptions.headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(this.body, 'utf8')
    };
  }

  addAuthentication () {
    const base64 = new Buffer(this.config.apiKey).toString('base64');
    this.requestOptions.headers.authorization = `Basic ${base64}`;
  }

  handleResponse (res) {
    return new Promise((resolve, reject) => {
      if (res.statusCode >= 500) {
        const error = new Error(`${res.statusCode} - ${res.statusMessage}`);
        error.statusCode = res.statusCode;
        reject(error);
      }

      const buffers = [];
      let totalLength = 0;
      res.on('data', (d) => {
        buffers.push(d);
        totalLength += d.length;
      });
      res.on('end', (d) => {
        const buffer = Buffer.concat(buffers, totalLength);
        const raw = buffer.toString();
        resolve({ raw, statusCode: res.statusCode });
      });
    });
  }
}

module.exports.Request = Request;
