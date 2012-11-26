var expect = require('expect.js'),
    Checklist = require('checklist'),
    async = require('async'),
    MockBrowserstack = require('../../Mocks/MockBrowserstack');

var VALID_BROWSER_1 = {
  os: 'apple',
  browser: 'banana',
  version: 'pear'
};
var VALID_BROWSER_2 = {
  os: 'hello',
  browser: 'goodbye',
  version: 'huh'
};
var VALID_BROWSER_3 = {
  os: 'foo',
  device: 'bar',
  version: 'foobar'
};
var INVALID_BROWSER = {
  os: 'invalid',
  browser: 'invalid',
  version: 'invalid'
};
var BROWSERS = [
  VALID_BROWSER_1,
  VALID_BROWSER_2,
  VALID_BROWSER_3
];
var QUEUE_TIME = 200;
var TERMINATION_TIME = 500;
var SAFETY_TIME = 200;
var ACCEPTABLE_TIME_VARIANCE = 50;
var USERNAME = 'username';
var PASSWORD = 'password';
var BAD_USERNAME = 'badusername';
var BAD_PASSWORD = 'badpassword';
var BAD_WORKER_ID = 'nonsense';

describe('MockBrowserstack', function() {
  var mockBrowserstack;

  beforeEach(function() {
    mockBrowserstack = new MockBrowserstack({
      browsers: BROWSERS,
      queueTime: QUEUE_TIME,
      username: USERNAME,
      password: PASSWORD
    });
  });

  describe('#reset', function() {
    it('should terminate all workers', function(done) {
      var client = mockBrowserstack.createClient({
        username: USERNAME,
        password: PASSWORD,
        version: 'apple',
        server: 'banana'
      });
      async.forEach(BROWSERS, function(browser, callback) {
        client.createWorker(browser, function(error, worker) {
          callback();
        });
      }, function(error) {
        // error should be nothing as we never callback with one!
        mockBrowserstack.reset();
        client.getWorkers(function(error, workers) {
          expect(error).to.not.be.ok();
          expect(workers.length).to.equal(0);
          done();
        });
      });
    });
  });

  describe('#createClient', function() {
    var authorizedClient;
    var badPasswordClient;
    var badUsernameClient;

    beforeEach(function() {
      authorizedClient = mockBrowserstack.createClient({
        username: USERNAME,
        password: PASSWORD,
        version: 'apple',
        server: 'banana'
      });
      badPasswordClient = mockBrowserstack.createClient({
        username: USERNAME,
        password: BAD_PASSWORD,
        version: 'foo',
        server: 'bar'
      });
      badUsernameClient = mockBrowserstack.createClient({
        username: BAD_USERNAME,
        password: PASSWORD,
        version: 'hello',
        server: 'goodbye'
      });
    });    

    it('should expose settings', function() {
      expect(authorizedClient.username).to.equal(USERNAME);
      expect(authorizedClient.password).to.equal(PASSWORD);
      expect(authorizedClient.version).to.equal('apple');
      expect(authorizedClient.server).to.equal('banana');
      expect(badPasswordClient.username).to.equal(USERNAME);
      expect(badPasswordClient.password).to.equal(BAD_PASSWORD);
      expect(badPasswordClient.version).to.equal('foo');
      expect(badPasswordClient.server).to.equal('bar');
      expect(badUsernameClient.username).to.equal(BAD_USERNAME);
      expect(badUsernameClient.password).to.equal(PASSWORD);
      expect(badUsernameClient.version).to.equal('hello');
      expect(badUsernameClient.server).to.equal('goodbye');
    });

    describe('#getBrowsers', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.getBrowsers(function(error, browsers) {
          expect(error.message).to.equal('not authorized');
          expect(browsers).to.not.be.ok();
          badUsernameClient.getBrowsers(function(error, browsers) {
            expect(error.message).to.equal('not authorized');
            expect(browsers).to.not.be.ok();
            done();
          });
        });
      });

      it('should return the browsers', function(done) {
        authorizedClient.getBrowsers(function(error, browsers) {
          expect(error).to.not.be.ok();
          expect(browsers).to.equal(BROWSERS);
          done();
        });
      });
    });

    describe('#createWorker', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.createWorker({
          os: 'hello',
          browser: 'boo',
          version: 'huh'
        }, function(error, worker) {
          expect(error.message).to.equal('not authorized');
          expect(worker).to.not.be.ok();
          badUsernameClient.createWorker({
            os: 'hello',
            browser: 'boo',
            version: 'huh'
          }, function(error, worker) {
            expect(error.message).to.equal('not authorized');
            expect(worker).to.not.be.ok();
            done();
          });
        });
      });

      it('should error if the browser is invalid', function(done) {
        authorizedClient.createWorker(INVALID_BROWSER, function(error, worker) {
          expect(error.message).to.equal('invalid browser settings');
          expect(worker).to.not.be.ok();
          done();
        });
      });

      it('should create workers with correct settings, unique IDs and intitial status of "queue"', function(done) {
        authorizedClient.createWorker({
          os: VALID_BROWSER_1.os,
          browser: VALID_BROWSER_1.browser,
          version: VALID_BROWSER_1.version,
          url: 'my url'
        }, function(error, worker1) {
          expect(error).to.not.be.ok();
          expect(worker1.id).to.be.ok();
          expect(worker1.status).to.not.be.ok();
          expect(worker1.os).to.not.be.ok();
          expect(worker1.browser).to.not.be.ok();
          expect(worker1.version).to.not.be.ok();
          authorizedClient.getWorker(worker1.id, function(error, worker) {
            expect(error).to.not.be.ok();
            expect(worker.status).to.equal('queue');
            expect(worker.os).to.equal(VALID_BROWSER_1.os);
            expect(worker.browser).to.equal(VALID_BROWSER_1.browser);
            expect(worker.version).to.equal(VALID_BROWSER_1.version);
          });
          authorizedClient.getWorkerExtraFields(worker1.id, function(error, worker) {
            expect(error).to.not.be.ok();
            expect(worker.url).to.equal('my url');
          });
          authorizedClient.createWorker({
            os: VALID_BROWSER_2.os,
            browser: VALID_BROWSER_2.browser,
            version: VALID_BROWSER_2.version,
            url: 'another url'
          }, function(error, worker2) {
            expect(error).to.not.be.ok();
            expect(worker2.id).to.be.ok();
            expect(worker2.id).to.not.eql(worker1.id);
            expect(worker2.status).to.not.be.ok();
            expect(worker2.os).to.not.be.ok();
            expect(worker2.browser).to.not.be.ok();
            expect(worker2.version).to.not.be.ok();
            authorizedClient.getWorker(worker2.id, function(error, worker) {
              expect(error).to.not.be.ok();
              expect(worker.status).to.equal('queue');
              expect(worker.os).to.equal(VALID_BROWSER_2.os);
              expect(worker.browser).to.equal(VALID_BROWSER_2.browser);
              expect(worker.version).to.equal(VALID_BROWSER_2.version);
            });
            authorizedClient.getWorkerExtraFields(worker2.id, function(error, worker) {
              expect(error).to.not.be.ok();
              expect(worker.url).to.equal('another url');
            });
            done();
          });
        });
      });
    });

    describe('#getWorker', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.getWorker(BAD_WORKER_ID, function(error, worker) {
          expect(error.message).to.equal('not authorized');
          expect(worker).to.not.be.ok();
          badUsernameClient.getWorker(BAD_WORKER_ID, function(error, worker) {
            expect(error.message).to.equal('not authorized');
            expect(worker).to.not.be.ok();
            done();
          });
        });
      });

      it('should error if there is no matching worker', function(done) {
        authorizedClient.getWorker(BAD_WORKER_ID, function(error, worker) {
          expect(error.message).to.equal('no such worker');
          expect(worker).to.not.be.ok();
          done();
        });
      });

      it('should return a running worker after the queue time set in the MockBrowserstack instance', function(done) {
        this.timeout(3000);
        authorizedClient.createWorker(VALID_BROWSER_1, function(error, worker1) {
          if (error) {
            expect().fail('could not create worker');
          } else {
            setTimeout(function() {
              authorizedClient.getWorker(worker1.id, function(error, worker2) {
                if (error) {
                  expect().fail('could not get worker');
                } else {
                  expect(worker2.status).to.equal('running');
                  done();
                }
              });
            }, QUEUE_TIME + SAFETY_TIME);
          }
        });
      });

      it('should not be able to find a worker after the termination timeout set on creation', function(done) {
        this.timeout(4000);
        authorizedClient.createWorker({
          os: VALID_BROWSER_1.os,
          browser: VALID_BROWSER_1.browser,
          version: VALID_BROWSER_1.version,
          timeout: TERMINATION_TIME
        }, function(error, worker1) {
          if (error) {
            expect().fail('could not create worker');
          } else {
            // timeout should have been added to worker as a property
            authorizedClient.getWorkerExtraFields(worker1.id, function(error, worker) {
              expect(error).to.not.be.ok();
              expect(worker.timeout).to.equal(TERMINATION_TIME);
            });
            setTimeout(function() {
              authorizedClient.getWorker(worker1.id, function(error, worker2) {
                expect(error.message).to.equal('no such worker');
                expect(worker2).to.not.be.ok();
                done();
              });
            }, TERMINATION_TIME + QUEUE_TIME + SAFETY_TIME);
          }
        });
      });
    });

    describe('#getWorkerExtraFields', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.getWorkerExtraFields(BAD_WORKER_ID, function(error, worker) {
          expect(error.message).to.equal('not authorized');
          expect(worker).to.not.be.ok();
          badUsernameClient.getWorkerExtraFields(BAD_WORKER_ID, function(error, worker) {
            expect(error.message).to.equal('not authorized');
            expect(worker).to.not.be.ok();
            done();
          });
        });
      });

      it('should error if there is no matching worker', function(done) {
        authorizedClient.getWorkerExtraFields(BAD_WORKER_ID, function(error, worker) {
          expect(error.message).to.equal('no such worker');
          expect(worker).to.not.be.ok();
          done();
        });
      });
    });

    describe('#getWorkers', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.getWorkers(function(error, workers) {
          expect(error.message).to.equal('not authorized');
          expect(workers).to.not.be.ok();
          badUsernameClient.getWorkers(function(error, workers) {
            expect(error.message).to.equal('not authorized');
            expect(workers).to.not.be.ok();
            done();
          });
        });
      });

      it('should return a snapshot array of all the workers currently active', function(done) {
        var testWorkers = [];
        var browserChecklist = new Checklist(BROWSERS, function(error) {
          authorizedClient.getWorkers(function(error, workers) {
            for (var index = 0; index < testWorkers.length; index++) {
              var browser = BROWSERS[index];
              var worker = workers[index];
              expect(worker.os).to.equal(browser.os);
              if (worker.browser) {
                expect(worker.browser).to.equal(browser.browser);
              } else {
                expect(worker.device).to.equal(browser.device);
              }
              expect(worker.version).to.equal(browser.version);
              expect(worker.id).to.equal(testWorkers[index].id);
              expect(worker.status).to.equal('queue');
            }
            done();
          });
        });
        BROWSERS.forEach(function(browser) {
          authorizedClient.createWorker(browser, function(error, worker) {
            testWorkers.push(worker);
            browserChecklist.check(browser);
          });
        });
      });
    });

    describe('#terminateWorker', function() {
      it('should error if client is unauthorized', function(done) {
        badPasswordClient.terminateWorker(BAD_WORKER_ID, function(error, data) {
          expect(error.message).to.equal('not authorized');
          expect(data).to.not.be.ok();
          badUsernameClient.terminateWorker(BAD_WORKER_ID, function(error, data) {
            expect(error.message).to.equal('not authorized');
            expect(data).to.not.be.ok();
            done();
          });
        });
      });

      it('should error if the worker is not running or queued', function(done) {
        authorizedClient.terminateWorker(BAD_WORKER_ID, function(error, data) {
          expect(error.message).to.equal('no such worker');
          expect(data).to.not.be.ok();
          done();
        });
      });

      it('should report 0 active time if stopped while queued', function(done) {
        authorizedClient.createWorker(VALID_BROWSER_1, function(error, worker1) {
          if (error) {
            expect().fail('could not create worker');
          } else {
            authorizedClient.terminateWorker(worker1.id, function(error, data) {
              expect(error).to.not.be.ok();
              expect(data.time).to.equal(0);
              authorizedClient.getWorker(worker1.id, function(error, worker2) {
                expect(error.message).to.equal('no such worker');
                expect(worker2).to.not.be.ok();
                done();
              });
            });
          }
        });        
      });

      it('should terminate a worker and report the length of time it was alive', function(done) {
        this.timeout(4000);
        authorizedClient.createWorker(VALID_BROWSER_1, function(error, worker1) {
          if (error) {
            expect().fail('could not create worker');
          } else {
            setTimeout(function() {
              authorizedClient.terminateWorker(worker1.id, function(error, data) {
                expect(error).to.not.be.ok();
                expect(data.time).to.be.within(TERMINATION_TIME - ACCEPTABLE_TIME_VARIANCE, TERMINATION_TIME + ACCEPTABLE_TIME_VARIANCE);
                authorizedClient.getWorker(worker1.id, function(error, worker2) {
                  expect(error.message).to.equal('no such worker');
                  expect(worker2).to.not.be.ok();
                  done();
                });
              });
            }, TERMINATION_TIME + QUEUE_TIME);
          }
        });        
      });
    });
  });
});
