'use strict'

var prime = require('prime')
var defer = require('prime/defer')
var partial = require('mout/function/partial')

var checkArg = function(name, arg){
    if (arg == undefined) {
        throw new Error('Missing argument: ' + name)
    }
}

var checkTime = partial(checkArg, 'time')
var checkCallback = partial(checkArg, 'callback')

var Watchout = prime({
    _stopped: false,

    /**
     * Constructor
     * @param  {Number}   time                      Delay for deferred function
     * @param  {Function} callback                  Deferred function
     * @param  {Function} task(reset, done, cancel) Optional. Executed immediately after deferred is created.
     */
    constructor: function(time, callback, task) {
        var scope = this

        checkTime(time)
        checkCallback(callback)
        
        scope._time = time
        scope._callback = callback
        scope._task = task

        scope._setDefer(time)

        task && task(function(time) {
            scope.reset(time)
        }, function() {
            scope.pass()
        }, function() {
            scope.cancel()
        })
    },

    /**
     * Cancel and cleanup deferred
     * @private
     */
    _cancel: function() {
        var scope = this
        var deferredCancel = scope._deferredCancel

        deferredCancel && deferredCancel()

        delete scope._deferredCancel
    },

    /**
     * Generate a deferred function
     * @private
     * @param {Number} time Delay for deferred function
     */
    _setDefer: function(time) {
        var scope = this

        checkTime(time)

        scope._deferredCancel = defer(function() {
            scope.fail()
        }, time)
    },

    /**
     * Reset the watchdog. Cancels the previously set deferred function
     * and sets a new one.
     * @param  {Number} time Delay for the deferred
     */
    reset: function(time) {
        var scope = this

        if (time === undefined) {
            time = scope._time
        }

        if (!scope._stopped) {
            scope._cancel()

            scope._setDefer(time)
        }
    },

    /**
     * Complete by canceling the watchdog and calling callback
     * @param  {Boolean}   haltedTimeout Determine whether the task was completed before the timeout
     */
    done: function(haltedTimeout) {
        var scope = this

        if (!scope._stopped) {
            scope._stopped = true

            scope._cancel()

            scope._callback(!!haltedTimeout)
        }
    },

    /**
     * Convenience method triggering done successfully
     */
    pass: function() {
        this.done(true)
    },

    /**
     * Convenience method triggering done unsuccessfully
     */
    fail: function() {
        this.done(false)
    },

    /**
     * Cancel the watchdog
     */
    cancel: function() {
        var scope = this

        if (!scope._stopped) {
            scope._stopped = true

            scope._cancel()
        }
    }
})

module.exports = Watchout
