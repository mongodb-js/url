var parse = require('mongodb-uri').parse;

function URL(s){
  if(!(this instanceof URL)) return new URL(s);
  this.url = s.toLowerCase();
  if(s.indexOf('mongodb://') === -1){
    this.url = 'mongodb://' + s;
  }
  this.data = parse(this.url);
  this.data.scope = this.data.scope || {};

  this._id = this.data.hosts[0].host.toLowerCase() + ':' + this.data.hosts[0].port;
  this.auth = this.data.auth;
  this.dbName = this.data.dbName;
}

URL.prototype.addParam = function(key, val){
  if(this.url.indexOf('?') === -1){
    this.url += '?';
  }
  else {
    this.url += '&';
  }
  this.url += key + '=' + val;

  return this.url;
};

URL.prototype.rs = function(name){
  this.data.scope.rs = name;
  this.addParam('rs', name);
  return this;
};

URL.prototype.shard = function(name){
  this.data.scope.shard = name;
  this.addParam('shard', name);
  return this;
};

URL.prototype.state = function(name){
  this.data.scope.state = name;
  this.addParam('state', name);
  return this;
};

URL.prototype.type = function(name){
  this.data.scope.type = name;
  this.addParam('type', name);
  return this;
};

URL.prototype.toString = function(){
  return this.url;
};

URL.prototype.toJSON = function(){
  var res = {_id: this._id};
  for(var k in this.data.scope){
    res[k] = this.data.scope[k];
  }
  return res;
};

module.exports = URL;
