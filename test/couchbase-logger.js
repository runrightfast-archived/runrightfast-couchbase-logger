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
			connectionListener : function() {
				console.log('CONNECTED TO COUCHBASE');
				done();
			},
			connectionErrorListener : function(error) {
				console.error(error);
				done(error);
			}
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

		couchbaseLogger = couchbaseLogger.on(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, loggedEventListener).on(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR,
				logErrorEventListener);
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

});