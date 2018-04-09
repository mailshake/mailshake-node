'use strict';
let Promise = require('es6-promise');
let http = require('http');
let https = require('https');
let url = require('url');
let Response = require('./response').Response;
let Buffer = require('safe-buffer').Buffer;

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
    let fullUrl = `${this.config.baseUrl}/${path}`;
    return this.executeRaw(fullUrl, args);
  }

  executeRaw (fullUrl, args) {
    this.prepare(fullUrl, args);
    this.addAuthentication();
    return new Promise((resolve, reject) => {
      let req = this.transport.request(this.requestOptions, (res) => {
        this.handleResponse(res)
          .then(resolve)
          .catch(reject);
      });
      this.response = new Response(fullUrl, args, this.config);
      req.on('error', reject);
      req.write(this.body);
      req.end();
    })
      .then(result => {
        return this.response.parse(null, result);
      })
      .catch(err => {
        if (!this.response) {
          this.response = new Response(null);
        }
        return this.response.parse(err);
      });
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
    let base64 = new Buffer(this.config.apiKey).toString('base64');
    this.requestOptions.headers.authorization = `Basic ${base64}`;
  }

  handleResponse (res) {
    return new Promise((resolve, reject) => {
      let buffers = [];
      let totalLength = 0;
      res.on('data', (d) => {
        buffers.push(d);
        totalLength += d.length;
      });
      res.on('end', (d) => {
        let buffer = Buffer.concat(buffers, totalLength);
        let raw = buffer.toString();
        resolve(raw);
      });
    });
  }
}

module.exports.Request = Request;
