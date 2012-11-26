var expect = require('expect.js'),
    uuid = require('node-uuid');

var DEFAULT_QUEUE_TIME = 1000;
var DEFAULT_TERMINATION_TIME = 1800 * 1000;

function MockBrowserstackWorker(settings) {
  var self = this;
  self.os = settings.os;
  self.browser = settings.browser;
  self.device = settings.device;
  self.url = settings.url;
  self.timeout = settings.timeout;
  self.version = settings.version;
  self.id = settings.id || uuid.v1();
  self.status = settings.status || 'queue';
}

function MockBrowserstackClient(mockBrowserstack, settings) {
  var self = this;

  self.username = settings.username;
  self.password = settings.password;
  self.version = settings.version;
  self.server = settings.server;

  self.getBrowsers = function(callback) {
    mockBrowserstack.getBrowsers(self, callback);
  };

  self.createWorker = function(settings, callback) {
    mockBrowserstack.createWorker(self, settings, callback);
  };

  self.getWorker = function(id, callback) {
    mockBrowserstack.getWorker(self, id, callback);
  };

  self.getWorkerExtraFields = function(id, callback) {
    mockBrowserstack.getWorkerExtraFields(self, id, callback);
  };

  self.getWorkers = function(callback) {
    mockBrowserstack.getWorkers(self, callback);
  };

  self.terminateWorker = function(id, callback) {
    mockBrowserstack.terminateWorker(self, id, callback);
  };
}

function MockBrowserstack(options) {
  var self = this,
      workers = [];

  function isAuthorized(client, callback) {
    if (client.username === options.username && client.password === options.password) {
      callback();
    } else {
      callback(new Error('not authorized'));
    }
  }

  function checkBrowser(settings, callback) {
    var isValid = false;
    options.browsers.forEach(function(browser) {
      if (
        browser.os === settings.os && (
          (browser.device && browser.device === settings.device) || 
          (browser.browser && browser.browser === settings.browser)
        ) &&
        browser.version === settings.version
      ) {
        isValid = true;
      }
    });
    callback(isValid);
  }

  self.getBrowsers = function(client, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
        callback(null, options.browsers);
      }
    });
  };

  self.createWorker = function(client, settings, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
        checkBrowser(settings, function(isValid) {
          if (isValid) {
            var worker = new MockBrowserstackWorker(settings);
            workers[worker.id] = worker;

            setTimeout(function() {
              worker.status = 'running';
              worker.started = new Date().getTime();
              setTimeout(function() {
                delete workers[worker.id];
              }, settings.timeout || DEFAULT_TERMINATION_TIME);
            }, options.queueTime || DEFAULT_QUEUE_TIME);

            callback(null, {
              id: worker.id
            });
          } else {
            callback(new Error('invalid browser settings'));
          }
        });
      }
    });
  };

  self.getWorker = function(client, id, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
        var worker = workers[id];
        if (worker) {
          callback(null, {
            status: worker.status,
            os: worker.os,
            device: worker.device,
            browser: worker.browser,
            version: worker.version
          });
        } else {
          callback(new Error('no such worker'));
        }
      }
    });
  };

  self.getWorkerExtraFields = function(client, id, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
        var worker = workers[id];
        if (worker) {
          callback(null, {
            url: worker.url,
            timeout: worker.timeout
          });
        } else {
          callback(new Error('no such worker'));
        }
      }
    });
  };

  self.getWorkers = function(client, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
        var workersSnapshot = [];
        Object.keys(workers).forEach(function(key) {
          workersSnapshot.push({
            id: workers[key].id,
            status: workers[key].status,
            os: workers[key].os,
            device: workers[key].device,
            browser: workers[key].browser,
            version: workers[key].version
          });
        });
        callback(null, workersSnapshot);
      }
    });
  };

  self.terminateWorker = function(client, id, callback) {
    isAuthorized(client, function(error) {
      if (error) {
        callback(error);
      } else {
      var now = new Date().getTime();
        var worker = workers[id];
        if (worker) {
          var time = 0;
          if (worker.started) {
            time = now - worker.started;
          }
          delete workers[id];
          callback(null, {time: time});
        } else {
          callback(new Error('no such worker'));      
        }
      }
    });
  };

  self.reset = function() {
    workers = [];
  };

  self.createClient = function(settings) {
    return new MockBrowserstackClient(self, settings);
  };
}

module.exports = MockBrowserstack;