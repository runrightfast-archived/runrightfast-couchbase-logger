# runrightfast-couchbase-logger

Logging Service logger that writes events to Couchbase. 
The purpose of this module is to provide a logListener implementation that can be plugged into runrightfast-logging-service  

## Prerequisites
- Requires the C client, libcouchbase, to be installed - see http://www.couchbase.com/communities/c/getting-started
- Running tests requires a local Couchbase server running and buckets named: 
 - default - used for testing Couchbase SDK
 - event-log - used to store event logs
 
## Require
	
	var couchbaseLogger = require('runrightfast-couchbase-logger').couchbaseLogger(options);
	var COUCHBASE_LOGGER_EVENT = require('runrightfast-couchbase-logger').COUCHBASE_LOGGER_EVENT;
	
- where options is an Object with the following properties:
 - couchbase - _REQUIRED_ - Couchbase connection options
 - connectionListener - _OPTIONAL_ - event listener that will be notified once the Couchbase connection has been established, i.e., the CouchbaseLogger has started
 - connectionErrorListener _OPTIONAL_ - event listener that will be notified if an error occurred while trying to connect to the Couchbase database.
 
- example options:

		var options = {
			couchbase : {
				"host" : [ "localhost:8091" ],
				"bucket" : "default"
			},
			connectionListener : function(logger) {
				console.log('CONNECTED TO COUCHBASE');			
			},
			connectionErrorListener : function(error,logger) {
				console.error(error);
				logger.stop();
			}
		};
	
- couchbaseLogger is an EventEmitter with the following events - COUCHBASE_LOGGER_EVENT defines the events that are available  
 - 'CONN_ERR' - emit(COUCHBASE_LOGGER_EVENT.CONN_ERR, error, self)
 - 'LOG_EVENT_ERR' - emit(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, error, event, logger)
 - 'LOGGED_EVENT' - emit(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, couchbaseSetResult) 
 - 'STARTING' - emit(COUCHBASE_LOGGER_EVENT.STARTING)
 - 'STARTED'
 - 'STOPPED'
 
		 //listen for logging errors
		 couchbaseLogger.on(COUCHBASE_LOGGER_EVENT.LOG_EVENT_ERR, function(error, event, logger) { ... }
	
- couchbaseLogger contains the following methods
 - _start(callback)_ - if not connected, will try to connect to the Couchbase database.   
    Connecting to the database occurs asynchronously. If a _callback_ is specified, then it will be notified when either the connection succeeds or fails.
    If the connection succeeds, the callback is invoked with the logger,i.e., callback(error). The _'STARTED'_ event is emitted.
    If the connection fails, then the callback is invoked with the error and logger, i.e., callback(error,logger).
 - _stop()_ - shutsdown the Couchbase database connection
 - _logEvent(event)_ - logs an event to the Couchbase database asynchronously.
    emits 'LOG_EVENT_ERR' or 'LOGGED_EVENT'
 - _logListener()_ - returns a function bound to the CouchbaseLogger instance that can used to configure a LoggingService (runrightfast-logging-service) 
	
## Usage - integrating with runrightfast-logging-service

	var couchbaseLoggerOptions = { /* configure options */ };
	var couchbaseLogger = require('runrightfast-couchbase-logger').couchbaseLogger(couchbaseLoggerOptions);
	couchbaseLogger.start();

	var loggingServiceOptions = {
		logListener : couchbaseLogger.logListener()
		// configure other options
	};

	var loggingService = require('runrightfast-logging-service')(loggingServiceOptions);
	

	
	
	
	
	


 
