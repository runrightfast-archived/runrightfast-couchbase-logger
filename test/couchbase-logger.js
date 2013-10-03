/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

'use strict';
var expect = require('chai').expect;
var uuid = require('uuid');
var CouchbaseLogger = require('../lib/couchbase-logger');
var couchbaseConnectionManager = require('runrightfast-couchbase').couchbaseConnectionManager;

describe('CouchbaseLogger', function() {
	var couchbaseLogger = null;

	before(function(done) {
		var options = {
			couchbase : {
				"host" : [ "localhost:8091" ],
				buckets : [ {
					"bucket" : "default"
				} ]
			},
			connectionListener : function() {
				console.log('CONNECTED TO COUCHBASE');
				done();
			},
			connectionErrorListener : function(error) {
				console.error(error);
				done(error);
			},
			logLevel : 'DEBUG'
		};

		couchbaseConnectionManager.registerConnection(options);
		couchbaseLogger = new CouchbaseLogger({
			couchbaseConn : couchbaseConnectionManager.getBucketConnection('default'),
			logLevel : 'DEBUG'
		});
	});

	after(function(done) {
		var doneInvoked = 0;
		var connCount = couchbaseConnectionManager.getConnectionCount();
		couchbaseConnectionManager.stop(function() {
			doneInvoked++;
			console.log("******* doneInvoked = " + doneInvoked);
			if (connCount === doneInvoked) {
				done();
			}
		});
		couchbaseConnectionManager.clear();
	});

	afterEach(function() {
		couchbaseLogger.removeAllListeners();
	});

	it('#logEvent - 1 event', function(done) {
		var loggedEventListener = function(result) {
			console.log('loggedEventListener: ' + JSON.stringify(result));
			done();
		};

		var logErrorEventListener = function(errorEvent) {
			console.log('logErrorEventListener: ' + JSON.stringify(errorEvent));
			done(errorEvent.error);
		};

		couchbaseLogger.once(couchbaseLogger.events.LOGGED_EVENT, loggedEventListener).once(couchbaseLogger.events.LOG_EVENT_ERR, logErrorEventListener);
		expect(couchbaseLogger.listeners(couchbaseLogger.events.LOGGED_EVENT).length).to.be.at.least(1);
		expect(couchbaseLogger.listeners(couchbaseLogger.events.LOG_EVENT_ERR).length).to.be.at.least(1);

		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		couchbaseLogger.logEvent(event);

	});

	it('#logEvent - 10 times', function(done) {
		var counter = 0;
		var i;
		var event;
		var isDone = false;

		var loggedEventListener = function(result) {
			counter++;
			console.log('loggedEventListener : #%d: ', counter, JSON.stringify(result));
			if (counter === 10) {
				if (!isDone) {
					isDone = true;
					done();
				}
			}
		};

		var logErrorEventListener = function(errorEvent) {
			console.log('logErrorEventListener: ' + JSON.stringify(errorEvent));
			done(errorEvent.error);
		};

		for (i = 0; i < 10; i++) {
			couchbaseLogger.once(couchbaseLogger.events.LOGGED_EVENT, loggedEventListener).once(couchbaseLogger.events.LOG_EVENT_ERR, logErrorEventListener);
			expect(couchbaseLogger.listeners(couchbaseLogger.events.LOGGED_EVENT).length).to.be.at.least(1);
			expect(couchbaseLogger.listeners(couchbaseLogger.events.LOG_EVENT_ERR).length).to.be.at.least(1);
			event = {
				tags : [ 'info' ],
				data : 'test message from CouchbaseLogger.logEvent',
				ts : new Date(),
				uuid : uuid.v4()
			};
			couchbaseLogger.logEvent(event);
		}
	});

	it('#logListener', function(done) {
		var loggedEventListener = function(result) {
			console.log('loggedEventListener: ' + JSON.stringify(result));
			done();
		};

		var logErrorEventListener = function(errorEvent) {
			console.log('logErrorEventListener: ' + JSON.stringify(errorEvent));
			done(errorEvent.error);
		};

		couchbaseLogger.once(couchbaseLogger.events.LOGGED_EVENT, loggedEventListener).once(couchbaseLogger.events.LOG_EVENT_ERR, logErrorEventListener);
		var listeners = couchbaseLogger.listeners(couchbaseLogger.events.LOGGED_EVENT);
		expect(listeners.length).to.equal(1);

		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		var logListener = couchbaseLogger.logListener();
		logListener(event);
	});

	it("#logEvent - emits 'LOG_EVENT_ERR' when logging the event fails", function(done) {
		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};

		couchbaseLogger.once(couchbaseLogger.events.LOG_EVENT_ERR, function(error, event2, logger) {
			try {
				expect(error).to.exist;
				expect(event2).to.exist;
				expect(event2.uuid).to.equal(event.uuid);
				expect(logger).to.exist;
				console.log('typeof logger : ' + (typeof logger));

				if (error instanceof Error) {
					done();
				} else {
					done(new Error('expected an Error but got : ' + error));
				}
			} catch (err) {
				done(err);
			}

		});

		couchbaseLogger.logEvent(event);
		couchbaseLogger.logEvent(event);
	});

	it('can integrate with runrightfast-logging-service', function(done) {
		var loggingServiceOptions = {
			logListener : couchbaseLogger.logListener()
		};
		var loggingService = require('runrightfast-logging-service')(loggingServiceOptions);

		couchbaseLogger.on(couchbaseLogger.events.LOGGED_EVENT, function(result) {
			console.log('EVENT WAS LOGGED : ' + JSON.stringify(result));
			done();
		});

		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		loggingService.log(event);
	});

	it('can can be converted to a runrightfast-logging-service instance', function(done) {
		var loggingService = couchbaseLogger.toLoggingService();

		couchbaseLogger.on(couchbaseLogger.events.LOGGED_EVENT, function(result) {
			console.log('EVENT WAS LOGGED : ' + JSON.stringify(result));
			done();
		});

		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		loggingService.log({
			data : 'bad event'
		});
		loggingService.log(event);
	});

	it('can can be converted to a runrightfast-logging-service instance', function() {
		var loggingService = couchbaseLogger.toLoggingService();

		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		loggingService.log({
			data : 'bad event'
		});
		loggingService.log(event);
	});

});