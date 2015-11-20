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
  it('should not require the port', function() {
    assert.equal(parse.port('mongodb://localhost/'), 27017);
  });
  it('should not confuse authSource and dbName', function() {
    var res = parse('mongodb://thomas:password@localhost/firstdb?&authMechanism=MONGODB-CR&authSource=test');
    assert.equal(res.dbName, 'firstdb');
    assert.equal(res.db_options.authSource, 'test');
  });
});
