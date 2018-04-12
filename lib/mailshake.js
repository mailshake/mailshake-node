'use strict';
let Request = require('./request').Request;
let Config = require('./config').Config;

function translateHyphensToCamelCase (text) {
  let segments = text.split('-');
  if (segments.length <= 1) {
    return text;
  }
  return segments.reduce(
    (response, row) => {
      if (response) {
        return response + row.substring(0, 1).toUpperCase() + row.substring(1);
      } else {
        return row;
      }
    },
    ''
  );
}

let Mailshake = (arg1, arg2) => {
  function execute (path, args) {
    let request = new Request(config);
    return request.execute(path, args);
  }

  function createOperation (group, path, operationName) {
    operationName = translateHyphensToCamelCase(operationName);
    group[operationName] = args => execute(path, args);
  }

  function addOperation (path) {
    let segments = path.split('/');
    let group = instance;
    while (segments.length > 0) {
      let segment = segments.shift();
      if (segments.length === 0) {
        createOperation(group, path, segment);
      } else {
        if (!group[segment]) {
          group[segment] = {};
        }
        group = group[segment];
      }
    }
  }

  function addOperations (list) {
    list.forEach(path => addOperation(path));
  }

  let config = new Config(arg1, arg2);
  let instance = {
    init (arg1, arg2) {
      config.init(arg1, arg2);
    }
  };
  addOperations([
    'me',
    'campaigns/list',
    'campaigns/get',
    'campaigns/pause',
    'campaigns/unpause',
    'campaigns/export',
    'campaigns/export-status',
    'leads/list',
    'leads/get',
    'leads/close',
    'leads/create',
    'leads/ignore',
    'leads/reopen',
    'recipients/add',
    'recipients/add-status',
    'recipients/list',
    'recipients/get',
    'recipients/pause',
    'recipients/unpause',
    'recipients/unsubscribe',
    'team/list-members',
    'push/create',
    'push/delete',
    'activity/clicks',
    'activity/created-leads',
    'activity/lead-status-changes',
    'activity/opens',
    'activity/replies',
    'activity/sent'
  ]);
  instance.push.fetch = (url) => {
    let request = new Request(config);
    return request.executeRaw(url);
  };
  return instance;
};

module.exports.Mailshake = Mailshake;
