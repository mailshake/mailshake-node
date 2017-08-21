'use strict';
let config = require('./CONFIG.json');
let Mailshake = require('./index')(config);
Mailshake.me()
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err.stack);
    console.error(JSON.stringify(err, null, 2));
    process.exit(1);
  });
