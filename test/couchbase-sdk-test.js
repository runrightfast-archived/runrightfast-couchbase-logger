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
var Couchbase = require('couchbase');

var couchbaseConfig = {
	"host" : [ "localhost:8091" ],
	"bucket" : "default"
};

describe('Couchbase SDK', function() {
	var cb = null;

	before(function(done) {
		cb = new Couchbase.Connection(couchbaseConfig, function(err) {
			if (err) {
				done(err);
			}
			console.log('Couchbase connection established.');
			done();
		});

	});

	after(function(done) {
		cb.shutdown();
		console.log('Couchbase connection has been shutdown.');
		done();
	});

	it('can be used to set / get docs', function(done) {
		var setGet = function(key, value, callback) {
			cb.set(key, value, function(error, result) {
				if (error) {
					done(error);
				}
				console.log('value was saved: ' + JSON.stringify(value));
				cb.get(key, function(error, result) {
					if (error) {
						done(error);
					}
					callback(result);
					done();
				});
			});
		};

		var event = {
			tags : [ 'info' ],
			data : 'test message',
			ts : new Date(),
			uuid : uuid.v4()
		};

		setGet(event.uuid, event, function(result) {
			console.log('result : ' + JSON.stringify(result));
		});
	});

});