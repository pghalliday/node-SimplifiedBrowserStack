node-SimplifiedBrowserStack
=========

A simplified interface for starting and stopping BrowserStack workers

## Features

- #list
  - should list all available browsers
  - should fail if not authorized
- #start
  - should return a list of running workers pointing at the correct URL
  - should fail if not authorized
  - should fail if a worker cannot be started and terminate any workers that were started
  - should fail if an error is encountered while waiting for workers to start
  - should fail if workers are not running within specified timeout value
  - should fail if already started
- #stop
  - should fail if not started
  - when started
    - should terminate all (and only) the workers previously started by this instance
    - should fail if a worker cannot be terminated
- #clean
  - should terminate all the workers associated with the given credentials
  - should fail if started
  - should fail if not authorized

## Installation

```
npm install node-SimplifiedBrowserStack
```

## API

```javascript
var SimplifiedBrowserStack = require('node-SimplifiedBrowserStack');

var simplifiedBrowserStack = new SimplifiedBrowserStack({
  username: 'USERNAME',
  password: 'PASSWORD'
});

simplifiedBrowserStack.list(function(error, browsers) {
  // browsers will be an array of available browser types
});

simplifiedBrowserStack.start({
  // time to wait for workers to start running
  queueTimeout: QUEUE_TIMEOUT,
  // default URL for started workers
  url: 'URL',
  // default timeout for started workers
  timeout: TIMEOUT,
  // list of browser types to start, as returned from the list function
  browsers: [{
    os: 'OS',
    browser: 'BROWSER',
    version: 'VERSION',
    // override the default URL
    url: 'URL',
    // override the default worker timeout
    timeout: TIMEOUT
  }, {
    os: 'OS',
    browser: 'BROWSER',
    version: 'VERSION',
    // override the default URL
    url: 'URL',
    // override the default worker timeout
    timeout: TIMEOUT
  }]
}, function(errors, workers) {
  // the workers array will contain the started worker IDs

  simplifiedBrowserStack.stop(function(errors) {
    // the workers will have been stopped

    // errors may be reported if a worker has already timed out
    // but any running workers should have been stopped anyway
  });
});

simplifiedBrowserStack.clean(function(errors) {
  // Should stop any workers associated with the
  // BrowserStack account

  // useful for cleaning up orphaned workers
});

```

## Roadmap

- Nothing yet

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using ``./grunt.sh`` or ``.\grunt.bat``.

## License
Copyright (c) 2012 Peter Halliday  
Licensed under the MIT license.