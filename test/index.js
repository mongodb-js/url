var getURL = require('../'),
  assert = require('assert');

describe('mongodb-url', function(){
  it('should work', function(){
    var res = getURL('localhost:27017').type('standalone').toString();
    assert.equal(res, 'mongodb://localhost:27017?type=standalone');
  });
});
