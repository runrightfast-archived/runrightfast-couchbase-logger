'use strict';
var expect = require('chai').expect;

var events = require('events');
var lodash = require('lodash');
var util = require('util');

describe('EventEmiiter', function() {

	it('emits events synchronously', function() {
		var eventEmitter = new events.EventEmitter();
		var counter = 0;
		eventEmitter.on('event', function() {
			console.log(counter);
			counter++;
		});

		for ( var i = 0; i < 10; i++) {
			eventEmitter.emit('event');
			console.log('emitted event : ' + i);
		}

		expect(counter).to.equal(10);

	});

	it('emits events asynchronously', function(done) {
		var eventEmitter = new events.EventEmitter();
		var counter = 0;
		eventEmitter.on('event', function() {
			console.log(counter);
			counter++;
			if (counter == 10) {
				done();
			}
		});

		for ( var i = 0; i < 10; i++) {
			setImmediate(function() {
				eventEmitter.emit('event');
			});
			console.log('emitted event : ' + i);
		}

		expect(counter).to.equal(0);

	});
});