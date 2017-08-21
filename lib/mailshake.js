'use strict';
let Request = require('./request').Request;
let Config = require('./config').Config;

let Mailshake = (arg1, arg2) => {
  function execute(path, args) {
    let request = new Request(config);
    return request.execute(path, args);
  }

  function createOperation(path) {
    return args => execute(path, args);
  }

  function addOperation(path) {
    let segments = path.split('/');
    let group = instance;
    while (segments.length > 0) {
      let segment = segments.shift();
      if (segments.length === 0) {
        group[segment] = createOperation(path);
      }
      else {
        group = group[segment] = {};
      }
    }
  }

  function addOperations(list) {
    list.forEach(path => addOperation(path));
  }

  let config = new Config(arg1, arg2);
  let instance = {
    init(arg1, arg2) {
      config.init(arg1, arg2);
    }
  };
  addOperations([
    'me',
    'campaigns/list',
    'campaigns/pause',
    'campaigns/unpause',
    'leads/list',
    'leads/create',
    'leads/ignore',
    'leads/reopen'
  ]);
  return instance;
};

module.exports.Mailshake = Mailshake;
