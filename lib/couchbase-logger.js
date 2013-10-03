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

/**
 * The CouchbaseLogger is meant to be integrated with the
 * runrightfast-logging-service. It provides a logHandler function that can be
 * plugged into the LoggingService.
 * 
 * <code>
 * options = { 
 * 	 couchbaseConn: conn								// REQUIRED - Couchbase.Connection
 *   logLevel : 'WARN' 									// OPTIONAL - Default is 'WARN'
 * }
 * </code>
 */
(function() {
	'use strict';

	var logging = require('runrightfast-commons').logging;
	var log = logging.getLogger('runrighfast-couchbase-logger');
	var events = require('runrightfast-commons').events;
	var lodash = require('lodash');
	var util = require('util');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	var EVENTS = {
		LOG_EVENT_ERR : 'LOG_EVENT_ERR',
		LOGGED_EVENT : 'LOGGED_EVENT'
	};

	/**
	 * constructor function
	 * 
	 * @param couchbaseOptions
	 */
	var CouchbaseLogger = function CouchbaseLogger(options) {
		events.AsyncEventEmitter.call(this);

		assert(lodash.isObject(options), 'options is required');
		assert(lodash.isObject(options.couchbaseConn), 'options.couchbaseConn is required');

		var logLevel = options.logLevel || 'WARN';
		logging.setLogLevel(log, logLevel);
		if (log.isLevelEnabled('DEBUG')) {
			log.debug(options);
		}

		this.cb = options.couchbaseConn;
	};

	util.inherits(CouchbaseLogger, events.AsyncEventEmitter);

	CouchbaseLogger.prototype.events = EVENTS;

	/**
	 * emits the following events :
	 * 
	 * <code>
	 * 'LOG_EVENT_ERR'  		If logging the event failed, with event data (error, event, logger): { error : error, event : event, logger: logger }
	 * 'LOGGED_EVENT'			If logging the event was successful, then a 'LOGGED_EVENT' is emitted returning the Couchbase set result as the event data
	 * </code>
	 * 
	 * @param event
	 */
	CouchbaseLogger.prototype.logEvent = function(event) {
		if (event) {
			var self = this;
			this.cb.add(event.uuid, event, function(error, result) {
				if (error) {
					self.emit(EVENTS.LOG_EVENT_ERR, error, event, self);
				} else {
					self.emit(EVENTS.LOGGED_EVENT, result);
				}
			});
		}
	};

	CouchbaseLogger.prototype.logListener = function() {
		return lodash.bind(this.logEvent, this);
	};

	CouchbaseLogger.prototype.toLoggingService = function(badEventListener) {
		var loggingServiceOptions = {
			logListener : this.logListener()
		};
		return require('runrightfast-logging-service')(loggingServiceOptions);
	};

	module.exports = CouchbaseLogger;

}());
