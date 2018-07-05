var ReadPreference = require('mongodb-core').ReadPreference;
var IPV6 = /\[([^\]]+)\](?:\:(.+))?'/;
var MONGO = 'mongodb://';
var MONGO_SRV = 'mongodb+srv://';

function parse(url, options) {
  // Ensure we have a default options object if none set
  if (!options) {
    options = {};
  }
  // Variables
  var connectionPart = '';
  var authPart = '';
  var queryStringPart = '';
  var dbName = 'admin';
  var protocol = 'mongodb://';

  if (url.indexOf(MONGO) === -1 && url.indexOf(MONGO_SRV) === -1) {
    url = MONGO + url;
  }

  if (url.indexOf(MONGO_SRV) > -1) {
    protocol = MONGO_SRV;
  }

  // @todo (imlucas): Switch to using `require('url').parse()`.
  // If we have a ? mark cut the query elements off
  if (url.indexOf('?') !== -1) {
    queryStringPart = url.substr(url.indexOf('?') + 1);
    connectionPart = url.substring(protocol.length, url.indexOf('?'));
  } else {
    connectionPart = url.substring(protocol.length);
  }

  // Check if we have auth params
  if (connectionPart.indexOf('@') !== -1) {
    authPart = connectionPart.split('@')[0];
    connectionPart = connectionPart.split('@')[1];
  }

  // Check if the connection string has a db
  if (connectionPart.indexOf('.sock') !== -1) {
    if (connectionPart.indexOf('.sock/') !== -1) {
      dbName = connectionPart.split('.sock/')[1];
      connectionPart = connectionPart.split('/',
        connectionPart.indexOf('.sock') + '.sock'.length);
    }
  } else if (connectionPart.indexOf('/') !== -1) {
    dbName = connectionPart.split('/')[1];
    connectionPart = connectionPart.split('/')[0];
  }

  // Result object
  var object = {};

  // Pick apart the authentication part of the string
  authPart = authPart || '';
  var auth = authPart.split(':', 2);

  // Decode the URI components
  auth[0] = decodeURIComponent(auth[0]);
  if (auth[1]) {
    auth[1] = decodeURIComponent(auth[1]);
  }

  // Add auth to final object if we have 2 elements
  if (auth.length === 2) {
    object.auth = {
      user: auth[0],
      password: auth[1]
    };
  }

  // Variables used for temporary storage
  var hostPart;
  var urlOptions;
  var servers;
  var serverOptions = {
    socketOptions: {}
  };
  var dbOptions = {
    read_preference_tags: []
  };
  var replSetServersOptions = {
    socketOptions: {}
  };
  // Add server options to final object
  object.server_options = serverOptions;
  object.db_options = dbOptions;
  object.rs_options = replSetServersOptions;
  object.mongos_options = {};

  // Let's check if we are using a domain socket
  if (url.match(/\.sock/)) {
    // Split out the socket part
    var domainSocket = url.substring(
      url.indexOf(protocol) + protocol.length
      , url.lastIndexOf('.sock') + '.sock'.length);
    // Clean out any auth stuff if any
    if (domainSocket.indexOf('@') !== -1) {
      domainSocket = domainSocket.split('@')[1];
    }
    servers = [{
      domain_socket: domainSocket
    }];
  } else {
    // Split up the db
    hostPart = connectionPart;
    // Deduplicate servers
    var deduplicatedServers = {};

    // Parse all server results
    servers = hostPart.split(',').map(function(h) {
      var _host;
      var _port;
      var ipv6match = IPV6.exec(h);
      // check if it matches [IPv6]:port, where the port number is optional
      if (ipv6match) {
        _host = ipv6match[1];
        _port = parseInt(ipv6match[2], 10) || 27017;
      } else {
        // otherwise assume it's IPv4, or plain hostname
        var hostPort = h.split(':', 2);
        _host = hostPort[0] || 'localhost';
        _port = hostPort[1] ? parseInt(hostPort[1], 10) : 27017;
        // Check for localhost?safe=true style case
        if (_host.indexOf('?') !== -1) {
          _host = _host.split(/\?/)[0];
        }
      }

      // No entry returned for duplicate servr
      if (deduplicatedServers[_host + '_' + _port]) {
        return null;
      }
      deduplicatedServers[_host + '_' + _port] = 1;

      // Return the mapped object
      return {
        host: _host,
        port: _port
      };
    }).filter(function(x) {
      return x !== null;
    });
  }

  // Get the db name
  object.dbName = dbName || 'admin';
  // Split up all the options
  urlOptions = (queryStringPart || '').split(/[&;]/);
  // Ugh, we have to figure out which options go to which constructor manually.
  urlOptions.forEach(function(opt) {
    /* eslint complexity:0, indent:0 */
    /**
     * @todo (imlucas): Cleanup.
     */
    if (!opt) {
      return;
    }
    var splitOpt = opt.split('=');
    var name = splitOpt[0];
    var value = splitOpt[1];
    // Options implementations
    switch (name) {
      case 'slaveOk':
      case 'slave_ok':
        serverOptions.slave_ok = value === 'true';
        dbOptions.slaveOk = value === 'true';
        break;
      case 'maxPoolSize':
      case 'poolSize':
        serverOptions.poolSize = parseInt(value, 10);
        replSetServersOptions.poolSize = parseInt(value, 10);
        break;
      case 'autoReconnect':
      case 'auto_reconnect':
        serverOptions.auto_reconnect = value === 'true';
        break;
      case 'minPoolSize':
        throw new TypeError('minPoolSize not supported');
      case 'maxIdleTimeMS':
        throw new TypeError('maxIdleTimeMS not supported');
      case 'waitQueueMultiple':
        throw new TypeError('waitQueueMultiple not supported');
      case 'waitQueueTimeoutMS':
        throw new TypeError('waitQueueTimeoutMS not supported');
      case 'uuidRepresentation':
        throw new TypeError('uuidRepresentation not supported');
      case 'ssl':
        if (value === 'prefer') {
          serverOptions.ssl = value;
          replSetServersOptions.ssl = value;
          break;
        }
        serverOptions.ssl = value === 'true';
        replSetServersOptions.ssl = value === 'true';
        break;
      case 'replicaSet':
      case 'rs_name':
        replSetServersOptions.rs_name = value;
        break;
      case 'reconnectWait':
        replSetServersOptions.reconnectWait = parseInt(value, 10);
        break;
      case 'retries':
        replSetServersOptions.retries = parseInt(value, 10);
        break;
      case 'readSecondary':
      case 'read_secondary':
        replSetServersOptions.read_secondary = value === 'true';
        break;
      case 'fsync':
        dbOptions.fsync = value === 'true';
        break;
      case 'journal':
        dbOptions.j = value === 'true';
        break;
      case 'safe':
        dbOptions.safe = value === 'true';
        break;
      case 'nativeParser':
      case 'native_parser':
        dbOptions.native_parser = value === 'true';
        break;
      case 'readConcernLevel':
        dbOptions.readConcern = {
          level: value
        };
        break;
      case 'connectTimeoutMS':
        serverOptions.socketOptions.connectTimeoutMS = parseInt(value, 10);
        replSetServersOptions.socketOptions.connectTimeoutMS = parseInt(value, 10);
        break;
      case 'socketTimeoutMS':
        serverOptions.socketOptions.socketTimeoutMS = parseInt(value, 10);
        replSetServersOptions.socketOptions.socketTimeoutMS = parseInt(value, 10);
        break;
      case 'w':
        dbOptions.w = parseInt(value, 10);
        if (isNaN(dbOptions.w)) {
          dbOptions.w = value;
        }
        break;
      case 'authSource':
        dbOptions.authSource = value;
        break;
      case 'gssapiServiceName':
        dbOptions.gssapiServiceName = value;
        break;
      case 'authMechanism':
        var rawValue = value.trim();
        if (rawValue === 'GSSAPI') {
          // If no password provided decode only the principal
          if (!object.auth) {
            var urlDecodeAuthPart = decodeURIComponent(authPart);
            if (urlDecodeAuthPart.indexOf('@') === -1) {
              throw new TypeError('GSSAPI requires a provided principal');
            }
            object.auth = {
              user: urlDecodeAuthPart,
              password: null
            };
          } else {
            object.auth.user = decodeURIComponent(object.auth.user);
          }
        } else if (rawValue === 'MONGODB-X509') {
          object.auth = {
            user: decodeURIComponent(authPart)
          };
        }

        // Only support GSSAPI or MONGODB-CR for now
        if (rawValue !== 'GSSAPI'
          && rawValue !== 'MONGODB-X509'
          && rawValue !== 'MONGODB-CR'
          && rawValue !== 'DEFAULT'
          && rawValue !== 'SCRAM-SHA-1'
          && rawValue !== 'SCRAM-SHA-256'
          && rawValue !== 'PLAIN') {
          throw new TypeError('only DEFAULT, GSSAPI, PLAIN, '
            + 'MONGODB-X509, SCRAM-SHA-1, SCRAM-SHA-256 or MONGODB-CR is supported by authMechanism');
        }


        // Authentication mechanism
        dbOptions.authMechanism = rawValue;
        break;
      case 'authMechanismProperties':
        // Split up into key, value pairs
        var values = value.split(',');
        var o = {};
        // For each value split into key, value
        values.forEach(function(x) {
          var v = x.split(':');
          o[v[0]] = v[1];
        });

        // Set all authMechanismProperties
        dbOptions.authMechanismProperties = o;
        // Set the service name value
        if (typeof o.SERVICE_NAME === 'string') {
          dbOptions.gssapiServiceName = o.SERVICE_NAME;
        }
        break;
      case 'wtimeoutMS':
        dbOptions.wtimeout = parseInt(value, 10);
        break;
      case 'readPreference':
        if (!ReadPreference.isValid(value)) {
          throw new TypeError('readPreference must be one of '
            + Object.keys(ReadPreference).join('|'));
        }
        dbOptions.read_preference = value;
        break;
      case 'readPreferenceTags':
        // Decode the value
        value = decodeURIComponent(value);
        // Contains the tag object
        var tagObject = {};
        if (value === null || value === '') {
          dbOptions.read_preference_tags.push(tagObject);
          break;
        }

        // Split up the tags
        var tags = value.split(/\,/);
        for (var i = 0; i < tags.length; i++) {
          var parts = tags[i].trim().split(/\:/);
          tagObject[parts[0]] = parts[1];
        }

        // Set the preferences tags
        dbOptions.read_preference_tags.push(tagObject);
        break;
      default:
        break;
    }
  });

  // No tags: should be null (not [])
  if (dbOptions.read_preference_tags.length === 0) {
    dbOptions.read_preference_tags = null;
  }

  // Validate if there are an invalid write concern combinations
  if ((dbOptions.w === -1 || dbOptions.w === 0) && (
    dbOptions.journal === true
    || dbOptions.fsync === true
    || dbOptions.safe === true)) {
    throw new TypeError('w set to -1 or 0 cannot be combined with safe/w/journal/fsync');
  }

  // If no read preference set it to primary
  if (!dbOptions.read_preference) {
    dbOptions.read_preference = 'primary';
  }

  // Add servers to result
  object.servers = servers;

  object.isSrvRecord = (protocol === MONGO_SRV);
  // Returned parsed object
  return object;
}

module.exports = parse;

module.exports.port = function(_id) {
  return parse(_id).servers[0].port;
};

module.exports.hostname = function(_id) {
  return parse(_id).servers[0].host;
};

/**
 * TODO (imlucas) Unify this value w/ the driver so we dont diverge.
 */
var DEFAULT = 'mongodb://localhost:27017/test';
module.exports.DEFAULT = DEFAULT;

module.exports.get = function(_default) {
  if (!_default) {
    _default = DEFAULT;
  }
  return process.env.MONGODB_URL || process.env.MONGOLAB_URI
    || process.env.MONGOHQ_URL || DEFAULT;
};
