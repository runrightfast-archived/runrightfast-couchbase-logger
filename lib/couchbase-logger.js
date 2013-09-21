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
 * 	 couchbase : {
 * 		host : [ 'localhost:8091' ],
 *		bucket : 'default',
 *		password : 'password' // optional
 *   },
 *   connectionListener : function(error){},
 *   connectionErrorListener : function(){},
 *   logLevel : 'WARN' // OPTIONAL - DEBUG | INFO | WARN | ERROR - default is WARN
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

	var COUCHBASE_LOGGER_EVENT = {
		CONN_ERR : 'CONN_ERR',
		LOG_EVENT_ERR : 'LOG_EVENT_ERR',
		LOGGED_EVENT : 'LOGGED_EVENT',
		STARTING : 'STARTING',
		STARTED : 'STARTED',
		STOPPED : 'STOPPED'
	};

	/**
	 * constructor function
	 * 
	 * @param couchbaseOptions
	 */
	var CouchbaseLogger = function CouchbaseLogger(options) {
		events.AsyncEventEmitter.call(this);

		this.options = options;

		if (lodash.isFunction(options.connectionListener)) {
			this.on(COUCHBASE_LOGGER_EVENT.STARTED, options.connectionListener);
		}

		if (lodash.isFunction(options.connectionErrorListener)) {
			this.on(COUCHBASE_LOGGER_EVENT.CONN_ERR, options.connectionErrorListener);
		}

	};

	util.inherits(CouchbaseLogger, events.AsyncEventEmitter);

	/**
	 * Emits a 'STARTING' event when invoked and the Couchbase connection has
	 * not yet been created.
	 * 
	 * if an error occurs while connecting, then an event is emitted where the
	 * event name is 'CONN_ERR' and the event data : (Error,CouchbaseLogger)
	 * 
	 * if the connection is successful, then an event is emitted where the event
	 * name is 'STARTED', with the CouchbaseListener as the event data
	 * 
	 * @param callback -
	 *            OPTIONAL: function(result){} - where result is either an Error
	 *            or CouchbaseLogger
	 */
	CouchbaseLogger.prototype.start = function(callback) {
		if (callback) {
			assert(lodash.isFunction(callback, 'callback must be a function'));
		}
		var Couchbase = require('couchbase');

		var self = this;

		if (!this.cb) {
			this.cb = new Couchbase.Connection(this.options.couchbase, function(error) {
				setImmediate(function() {
					if (error) {
						self.emit(COUCHBASE_LOGGER_EVENT.CONN_ERR, error, self);
						if (callback) {
							callback(error, self);
						}
					} else {
						self.emit(COUCHBASE_LOGGER_EVENT.STARTED, self);
						if (callback) {
							callback(self);
						}
					}
				});
				self.emit(COUCHBASE_LOGGER_EVENT.STARTING);
			});
		}
	};

	/**
	 * emits 'STOPPED' event with the CouchbaseLogger as the event data.
	 * 
	 */
	CouchbaseLogger.prototype.stop = function() {
		if (this.cb) {
			this.cb.shutdown();
			this.emit(COUCHBASE_LOGGER_EVENT.STOPPED, this);
			this.cb = undefined;
		}
	};

	/**
	 * emits an 'LOG_EVENT_ERR' if logging the event failed, with event data
	 * (error, event, logger):
	 * 
	 * <code>{ error : error, event : event, logger: logger }</code>
	 * 
	 * If logging the event was successful, then a 'LOGGED_EVENT' is emitted
	 * returning the Couchbase set result as the event data
	 * 
	 * @param event
	 */
	CouchbaseLogger.prototype.logEvent = function(event) {
		if (event) {
			var self = this;
			this.cb.set(event.uuid, event, function(error, result) {
				if (error) {
					self.emit(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, error, event, self);
				} else {
					self.emit(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, result);
				}
			});
		}
	};

	CouchbaseLogger.prototype.logListener = function() {
		return lodash.bind(this.logEvent, this);
	};

	module.exports.COUCHBASE_LOGGER_EVENT = COUCHBASE_LOGGER_EVENT;

	module.exports.couchbaseLogger = function(options) {
		assert(lodash.isObject(options), 'options is required');
		assert(lodash.isObject(options.couchbase), 'options.couchbase is required');
		if (options.connectionListener) {
			assert(lodash.isFunction(options.connectionListener), 'options.connectionListener must be a function');
		}
		if (options.connectionErrorListener) {
			assert(lodash.isFunction(options.connectionErrorListener), 'options.connectionErrorListener must be a function');
		}

		var logLevel = options.logLevel || 'WARN';
		logging.setLogLevel(log, logLevel);
		if (log.isLevelEnabled('DEBUG')) {
			log.debug(options);
		}

		return new CouchbaseLogger(options);
	};

}());
