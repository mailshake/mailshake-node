'use strict';
const path = require('path');
const { v4: uuid } = require('uuid');
const events = require('events');

function resolvePush (mailshake, receivedPush) {
  return mailshake.push.fetch(receivedPush.resource_url);
}

function pushHandlerExpress (mailshake, receivedPush, response) {
  return resolvePush(mailshake, receivedPush)
    .then(result => {
      response.status(200).send('ok!');
      return result;
    })
    .catch(err => {
      response.status(500).send({
        code: err.code,
        stack: err.stack
      });
      throw err;
    });
}

function trimEndSlash (url) {
  if (url[url.length - 1] === '/') {
    return url.substring(0, url.length - 1);
  }
  return url;
}

class PushHandler {
  constructor (mailshake, config) {
    this.mailshake = mailshake;
    this.baseUrl = trimEndSlash(config.baseUrl);
    this.rootPath = config.rootPath;
    this.secret = config.secret;
    this.events = new events.EventEmitter();
  }

  on (event, listenerFn) {
    this.events.on(event, listenerFn);
  }

  off (event, listenerFn) {
    this.events.removeListeners(event, listenerFn);
  }

  subscribe (event, filter) {
    const unique = uuid();
    const targetUrl = `${this.baseUrl}/${path.join(this.rootPath, this.secret, unique)}`;
    return this.mailshake.push.create({
      event,
      filter,
      target_url: targetUrl
      // targetUrl todo: set to this
    })
      .then(() => targetUrl);
  }

  unsubscribe (targetUrl) {
    return this.mailshake.push.delete({
      target_url: targetUrl
      // targetUrl todo: set to this
    });
  }

  hookExpress (expressApp) {
    const listenUrl = path.join('/', this.rootPath, this.secret, ':unique');
    expressApp.get(listenUrl, (req, res) => {
      res.send('Testing that your handler is installed correctly');
    });
    expressApp.post(listenUrl, (req, res) => {
      const receivedPush = req.body;
      pushHandlerExpress(this.mailshake, receivedPush, res)
        .then(result => this.events.emit('push', result))
        .catch(err => this.events.emit('pushError', err));
    });
  }
}

module.exports.resolvePush = resolvePush;
module.exports.PushHandler = PushHandler;
module.exports.pushHandlerExpress = pushHandlerExpress;
