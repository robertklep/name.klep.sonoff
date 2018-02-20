var Promise = require("bluebird");
var chai = require("chai");
var expect = chai.expect;

var Queue = require("..");


describe("Promise FIFO", function(){
	var BluebirdQueue = Queue.use(Promise);

	it("should construct with 'get' and 'put' functions", function(){
		var myQueue = new BluebirdQueue();

		expect(myQueue).itself.respondTo("get");
		expect(myQueue).itself.respondTo("put");
	});
	it("should be empty by default", function(){
		var myQueue = new BluebirdQueue();
		myQueue.put();

		var get = myQueue.get().toJSON();
		expect(get).to.have.property("isFulfilled", false);
		expect(get).to.have.property("isRejected", false);
	});
	it("should support basic operations", function(){
		var myQueue = new BluebirdQueue();
		myQueue.put("foo");

		return myQueue.get()
		.then(function(value){
			expect(value).to.equal("foo");
		});
	});
	it("should accept initial contents as array", function(){
		var myQueue = new BluebirdQueue([1,2]);
		myQueue.put(3);

		return myQueue.get()
		.then(function(value){
			expect(value, "first value").to.equal(1);

			return myQueue.get();
		})
		.then(function(value){
			expect(value, "second value").to.equal(2);

			return myQueue.get();
		})
		.then(function(value){
			expect(value, "third value").to.equal(3);
		});
	});

	it("should not break if get is called first", function(){
		var myQueue = new BluebirdQueue();
		var promise = myQueue.get();

		myQueue.put();
		return promise;
	});

	it("should resolve promises as part of get", function(){
		var myQueue = new BluebirdQueue();
		myQueue.put(new Promise(function(resolve, reject){
			resolve("foo");
		}));

		return myQueue.get()
		.then(function(value){
			expect(value).to.equal("foo");
		});
	});

	it("should reject in order appropriately", function(){
		var myQueue = new BluebirdQueue();

		myQueue.put(new Promise(function(resolve, reject){
			resolve("foo1");
		}));
		myQueue.put(new Promise(function(resolve, reject){
			reject("foo2");
		}));
		myQueue.put(new Promise(function(resolve, reject){
			resolve("foo3");
		}));

		return myQueue.get()

		.then(function(value){
			expect(value).to.equal("foo1");

			return myQueue.get();
		}, function(){
			throw new Error("first item should not have rejected");
		})

		.then(function(){
			throw new Error("second item should have rejected");
		}, function(err){
			expect(err).to.equal("foo2");
			return myQueue.get();
		})

		.then(function(value){
			expect(value).to.equal("foo3");
		}, function(){
			throw new Error("third item should not have rejected");
		});
	});

	it("should preserve order", function(){
		var myQueue = new BluebirdQueue([1]);

		var a = myQueue.get();
		var b = myQueue.get();
		var c = myQueue.get();
		myQueue.put(2);
		myQueue.put(3);
		var d = myQueue.get();
		setImmediate(function(){
			myQueue.put(4);
		});

		return Promise.join(a,b,c,d)
		.spread(function(a,b,c,d){
			expect(a).to.equal(1);
			expect(b).to.equal(2);
			expect(c).to.equal(3);
			expect(d).to.equal(4);
		});
	});

	it("should initialize with new Array properly", function(){
		var myQueue = new BluebirdQueue(new Array(3));

		return Promise.join(myQueue.get(), myQueue.get(), myQueue.get());
	});
});
