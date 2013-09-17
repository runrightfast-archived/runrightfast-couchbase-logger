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
 * <code>
 * options = { 
 * 	 couchbase : {
 * 		host : [ 'localhost:8091' ],
 *		bucket : 'default',
 *		password : 'password' // optional
 *   },
 *   connectionListener : function(error){},
 *   connectionErrorListener : function(){}
 * }
 * </code>
 */
(function() {
	'use strict';

	var events = require('events');
	var lodash = require('lodash');
	var util = require('util');
	var Hoek = require('hoek');
	var assert = Hoek.assert;

	var COUCHBASE_LOGGER_EVENT = {
		CONN_ERR : 'CONN_ERR',
		CONNECTED : 'CONNECTED',
		LOG_EVENT_ERR : 'LOG_EVENT_ERR',
		LOGGED_EVENT : 'LOGGED_EVENT',
		STARTED : 'STARTED',
		STOPPED : 'STOPPED'
	};

	/**
	 * constructor function
	 * 
	 * @param couchbaseOptions
	 */
	function CouchbaseLogger(options) {
		events.EventEmitter.call(this);

		var self = this;

		this.options = options;

		if (lodash.isFunction(options.connectionListener)) {
			this.on(COUCHBASE_LOGGER_EVENT.CONNECTED, options.connectionListener);
		}

		if (lodash.isFunction(options.connectionErrorListener)) {
			this.on(COUCHBASE_LOGGER_EVENT.CONN_ERR, options.connectionErrorListener);
		}

		/**
		 * if an error occurs while connecting, then an event is emitted where
		 * the event name is 'CONN_ERR' and the event data the Error
		 * 
		 * if the connection is successful, then an event is emitted where the
		 * event name is 'CONNECTED', with no event data
		 * 
		 * Emits a 'STARTED' event once the logger is started, but this does not
		 * mean that the connection is established, which is made
		 * asynchronously.
		 */
		this.start = function() {
			var Couchbase = require('couchbase');

			if (!this.cb) {
				this.cb = new Couchbase.Connection(this.options.couchbase, function(error) {
					if (error) {
						self.emit(COUCHBASE_LOGGER_EVENT.CONN_ERR, error);
					} else {
						self.emit(COUCHBASE_LOGGER_EVENT.CONNECTED, null);
					}
				});
				self.emit(COUCHBASE_LOGGER_EVENT.STARTED, null);
			}
		};

		/**
		 * emits 'STOPPED' event with event data : 'STOPPED'
		 * 
		 */
		this.stop = function() {
			if (this.cb) {
				this.cb.shutdown();
				this.emit(COUCHBASE_LOGGER_EVENT.STOPPED, null);
				this.cb = undefined;
			}
		};

		this.logListener = function() {
			return lodash.bind(this.logEvent, this);
		};

	}

	util.inherits(CouchbaseLogger, events.EventEmitter);

	CouchbaseLogger.prototype.logEvent = function(event) {
		if (event) {
			var self = this;
			this.cb.set(event.uuid, event, function(error, result) {
				if (error) {
					var data = {
						error : error,
						event : event
					};
					self.emit(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, data);
				} else {
					self.emit(COUCHBASE_LOGGER_EVENT.LOGGED_EVENT, result);
				}
			});
		}
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

		return new CouchbaseLogger(options);
	};

}());
