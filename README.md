# mongodb-url

[![build status](https://secure.travis-ci.org/imlucas/mongodb-url.png)](http://travis-ci.org/imlucas/mongodb-url)

Extend mongodb-uri for more flexibility and data packing.

## Example

```javascript
var toMongodb = require('mongodb-url');
console.log(getURL('localhost:27017').type('standalone').toString());
// 'mongodb://localhost:27017?type=standalone');
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

MIT
