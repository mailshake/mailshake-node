const Mailshake = require('../index')(process.env.API_KEY);
const assert = require('chai').assert;
const describe = require('mocha').describe;
const it = require('mocha').it;

describe('api:me', function () {
  it('should return a user model', function () {
    return Mailshake.me()
      .then(result => {
        assert.exists(result.user);
        assert.exists(result.user.id);
      });
  });
});
