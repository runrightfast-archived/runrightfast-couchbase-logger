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
var COUCHBASE_LOGGER_EVENT = require('../lib/couchbase-logger').COUCHBASE_LOGGER_EVENT;

describe('CouchbaseLogger', function() {
	var couchbaseLogger = null;

	before(function(done) {
		var options = {
			couchbase : {
				"host" : [ "localhost:8091" ],
				"bucket" : "default"
			},
			connectionListener : function(logger) {
				console.log('CONNECTED TO COUCHBASE');
				expect(logger).to.exist;
				done();
			},
			connectionErrorListener : function(error) {
				console.error(error);
				done(error);
			},
			logLevel : 'DEBUG'
		};
		couchbaseLogger = require('../lib/couchbase-logger').couchbaseLogger(options);
		couchbaseLogger.start();
	});

	after(function(done) {
		couchbaseLogger.on(COUCHBASE_LOGGER_EVENT.STOPPED, function() {
			console.log('Couchbase connection has been shutdown.');
			done();
		});
		couchbaseLogger.stop();
	});

	it('#logEvent', function(done) {
		var loggedEventListener = function(result) {
			console.log('loggedEventListener: ' + JSON.stringify(result));
			done();
		};

		var logErrorEventListener = function(errorEvent) {
			console.log('logErrorEventListener: ' + JSON.stringify(errorEvent));
			done(errorEvent.error);
		};

		couchbaseLogger.once(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, loggedEventListener).once(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, logErrorEventListener);
		var listeners = couchbaseLogger.listeners(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT);
		expect(listeners.length).to.equal(1);

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

		var loggedEventListener = function(result) {
			counter++;
			console.log('loggedEventListener : #%d: ', counter, JSON.stringify(result));
			if (counter == 10) {
				done();
			}
		};

		var logErrorEventListener = function(errorEvent) {
			console.log('logErrorEventListener: ' + JSON.stringify(errorEvent));
			done(errorEvent.error);
		};

		for ( var i = 0; i < 10; i++) {
			couchbaseLogger.once(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, loggedEventListener).once(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, logErrorEventListener);
			var listeners = couchbaseLogger.listeners(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT);
			var event = {
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

		couchbaseLogger.once(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, loggedEventListener).once(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, logErrorEventListener);
		var listeners = couchbaseLogger.listeners(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT);
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

	it("#start - can take an optional callback that will be called when the connection is successfully made", function(done) {
		var options = {
			couchbase : {
				"host" : [ "localhost:8091" ],
				"bucket" : "default"
			},
			connectionErrorListener : function(error) {
				console.error(error);
				done(error);
			}
		};

		var couchbaseLogger = require('../lib/couchbase-logger').couchbaseLogger(options);
		couchbaseLogger.start(function(logger) {
			expect(logger).to.be.defined;
			couchbaseLogger.stop();
			done();
		});
	});

	it("#start - can take an optional callback that will be called when the connection is made with an Error if the connection fails", function(done) {
		var options = {
			// invalid options with bucket that does not exist
			couchbase : {
				"host" : [ "localhost:8091" ],
				"bucket" : uuid.v4()
			},
			connectionErrorListener : function(error) {
				console.error(error);
			}
		};

		var couchbaseLogger = require('../lib/couchbase-logger').couchbaseLogger(options);
		couchbaseLogger.start(function(error) {
			if (error instanceof Error) {
				done();
			} else {
				done(new Error('expected an Error but got : ' + error));
			}

		});
	});

	it("#logEvent - emits 'LOG_EVENT_ERR' when logging the event fails", function(done) {
		var event = {
			tags : [ 'info' ],
			data : 'test message from CouchbaseLogger.logEvent',
			ts : new Date(),
			uuid : uuid.v4()
		};
		var options = {
			// invalid options with bucket that does not exist
			couchbase : {
				"host" : [ "localhost:8091" ],
				"bucket" : uuid.v4()
			},
			connectionErrorListener : function(error, logger) {
				console.error(error);
				logger.logEvent(event);
			}
		};

		var couchbaseLogger = require('../lib/couchbase-logger').couchbaseLogger(options);
		couchbaseLogger.on(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, function(error, event2, logger) {
			try {
				expect(error).to.exist;
				expect(event2).to.exist;
				expect(event2.uuid).to.equal(event.uuid);
				expect(logger).to.exist;
				console.log('typeof logger : ' + (typeof logger));
				logger.stop();

				if (error instanceof Error) {
					done();
				} else {
					done(new Error('expected an Error but got : ' + error));
				}
			} catch (err) {
				done(err);
			}

		});
		couchbaseLogger.start();
	});

	it('can integrate with runrightfast-logging-service', function(done) {
		var loggingServiceOptions = {
			logListener : couchbaseLogger.logListener()
		};
		var loggingService = require('runrightfast-logging-service')(loggingServiceOptions);

		couchbaseLogger.on(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, function(result) {
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

});