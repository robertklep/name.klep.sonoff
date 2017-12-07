watchout [![Build Status](https://travis-ci.org/GCheung55/watchout.png?branch=master)](https://travis-ci.org/GCheung55/watchout)
========

`watchout` is a JavaScript watchdog timer with a very simple API. 

## Install

```bash
$ npm install watchout
```

## Examples

### Basic usage
An instance is created. Once the timeout occurs, the callback is executed with a `haltedTimeout`, a boolean signifying whether the timer was cancelled or timeout occurred. In this example, the timeout occurred.

```javascript
var watchout = require('watchout')

// Timeout in 5000. Execute the callback with the results, whether timeout occurred or not.
var watchdog = new watchout(5000, function(haltedTimeout){
    if (haltedTimeout) {
        console.log('Timeout did not occur.')
    } else {
        console.log('Timeout occurred after 5000ms.')
    }
})
```

### Cancelling
A timer can be cancelled. Doing so will not execute the callback.

```javascript
var watchout = require('watchout')

var watchdog = new watchout(5000, function(haltedTimeout){
    console.log('I should never execute.')
})

watchdog.cancel()
```

### Reset
A timer can be reset, or extended.

```javascript
var watchout = require('watchout')

var watchdog = new watchout(5000, function(haltedTimeout){
    console.log('I should execute much later.')
})

// Assume that 4000ms has passed, now we want to reset the timer, which will extend the time by another 5000ms, extending a timer to a total of 9000ms.
watchdog.reset()
```

### Executing the callback right away
A timer can execute the callback right away with `pass` or `fail` methods. `pass` will execute the callback with a `true`, while `fail` will execute the callback with a `false`.

```javascript
var watchout = require('watchout')

var watchdogPass = new watchout(5000, function(haltedTimeout){
    if (haltedTimeout) {
        console.log('Timer did not timeout.')
    }
})

watchdogPass.pass()

var watchdogFail = new watchout(5000, function(haltedTimeout){
    if (!haltedTimeout) {
        console.log('Timeout occurred or was forced to timeout.')
    }
})

watchdogFail.fail()
```