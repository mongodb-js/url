var parse = require('../');
var assert = require('assert');

describe('mongodb-url', function() {
  it('should work', function() {
    assert.equal(typeof parse, 'function');
  });

  it('should not require the scheme', function() {
    assert.doesNotThrow(function() {
      parse('localhost:27017');
    });
  });

  it('should get the port', function() {
    assert.equal(parse.port('localhost:27017'), 27017);
  });
  it('should get the hostname', function() {
    assert.equal(parse.hostname('localhost:27017'), 'localhost');
  });
});
