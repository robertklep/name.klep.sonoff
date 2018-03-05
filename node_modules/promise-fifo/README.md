[![Build Status](https://travis-ci.org/mastercactapus/node-promise-fifo.svg?branch=master)](https://travis-ci.org/mastercactapus/node-promise-fifo)

promise-fifo
=================

A FIFO (first-in-first-out) queue using promises

You can use any promise library supporting the following format by passing the promise constructor to `.use`

```javascript
    new Promise(function(resolve, reject){
    
    });

    var Fifo = require("promise-fifo").use(Promise);
```


Installation
----
Installation is like any other node module:

    npm install promise-fifo

Usage
----

## Bluebird Example

```javascript
    var Promise = require("bluebird");
    var Fifo = require("promise-fifo").use(Promise);
  
    var myFifo = new Fifo(["foo"]);
    myFifo.put("bar");
    
    myFifo.get()
    .then(function(value){
      console.log(value); //foo
    })
    .then(myFifo.get)
    .then(function(value){
      console.log(value); //bar
    });
```

## Q Example
Using with Q is very similar, though based on your version, the constructor name may have a lower/uppercase `p`

See the Q API-Reference: https://github.com/kriskowal/q/wiki/API-Reference#qpromiseresolver


```javascript
    var Q = require("q");

    // > 0.9.7
    var Fifo = require("promise-fifo").use(Q.Promise);

    // <= 0.9.7
    var Fifo = require("promise-fifo").use(Q.promise);

```



Rate Limiting Example
----
Here we are limiting the amount of concurrent work done between `.get` and `.put` to the number of cpus on the machine.


```javascript
    //preload the Fifo with 'cpus().length' number of blank entries
    var myFifo = new Fifo(new Array(os.cpus().length));
    
    function process(data) {
    
      //get returns a promise
      return myFifo.get()
      .then(function(){
      
        //do async work here
        
      })
      
      //use finally so we call .put even when an error was thrown
      .finally(myFifo.put);
    }
```


