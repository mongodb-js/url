# mongodb-url [![][travis_img]][travis_url] [![][npm_img]][npm_url]

> How MongoDB URL's work.

## Example

```javascript
var parse = require('mongodb-url');
parse('localhost:27017')
>>> { dbName: 'admin', servers: [ { host: 'localhost', port: 27017 } ] }
parse('mongodb://localhost:27017')
>>> { dbName: 'admin', servers: [ { host: 'localhost', port: 27017 } ] }
```

## Install

```
npm install --save mongodb-url
```

## Test

```
npm test
```

## License

Apache 2

[travis_img]: https://img.shields.io/travis/mongodb-js/url.svg?style=flat-square
[travis_url]: https://travis-ci.org/mongodb-js/url
[npm_img]: https://img.shields.io/npm/v/mongodb-url.svg?style=flat-square
[npm_url]: https://www.npmjs.org/package/mongodb-url
