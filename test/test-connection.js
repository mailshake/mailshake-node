const Mailshake = require('../index')(process.env.API_KEY);
const { assert } = require('chai');
const { describe, it } = require('mocha');

describe('api:me', function () {
  it('should return a user model', function () {
    return Mailshake.me()
      .then(result => {
        assert.exists(result.user);
        assert.exists(result.user.id);
      });
  });
});
