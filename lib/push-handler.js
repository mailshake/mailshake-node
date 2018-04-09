'use strict';
let path = require('path');
let uuid = require('uuid/v4');
let events = require('events');

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
    let unique = uuid();
    let targetUrl = `${this.baseUrl}/${path.join(this.rootPath, this.secret, unique)}`;
    return this.mailshake['push-subscriptions'].create({ // todo: change back to just .push.
      event,
      filter,
      target_url: targetUrl
      // targetUrl todo: set to this
    })
      .then(() => targetUrl);
  }

  unsubscribe (targetUrl) {
    // return this.mailshake.push.delete({// todo: change back to just .push.
    return this.mailshake['push-subscriptions'].delete({
      target_url: targetUrl
      // targetUrl todo: set to this
    });
  }

  hookExpress (expressApp) {
    let listenUrl = path.join('/', this.rootPath, this.secret, ':unique');
    expressApp.get(listenUrl, (req, res) => {
      res.send(`Testing that your handler is installed correctly`);
    });
    expressApp.post(listenUrl, (req, res) => {
      let receivedPush = req.body;
      pushHandlerExpress(this.mailshake, receivedPush, res)
        .then(result => this.events.emit('push', result))
        .catch(err => this.events.emit('pushError', err));
    });
  }
}

module.exports.resolvePush = resolvePush;
module.exports.PushHandler = PushHandler;
module.exports.pushHandlerExpress = pushHandlerExpress;
