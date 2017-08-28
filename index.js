'use strict';
let Mailshake = require('./lib/mailshake').Mailshake;
module.exports = Mailshake;
module.exports.pushHandlerExpress = require('./lib/push-handler').pushHandlerExpress;
module.exports.resolvePush = require('./lib/push-handler').resolvePush;
module.exports.PushHandler = require('./lib/push-handler').PushHandler;
