
function Fifo(Promise, initialState) {

    this.Promise = Promise;
    this.assignResolve = this.bind(this._assignResolve, this);
    this.nextPromise = this.newPromise();

    var put = this.bind(this._put, this);

    if (initialState instanceof Array) {
        for (var i=0,len=initialState.length;i<len;i++){
            put(initialState[i]);
        }
    }

    return {
        get: this.bind(this._get, this),
        put: put
    };
}

Fifo.prototype = {
    bind: function(fn, self) {
        return function(value) {
            return fn(self, value);
        }
    },
    getHead: function(end) {
        return end.head;
    },
    getTail: function(end) {
        return end.tail;
    },
    newPromise: function() {
        return new this.Promise(this.assignResolve);
    },

    _assignResolve: function(self, resolve) {
        self.nextResolve = resolve;
    },
    _get: function(self){
        var result = self.nextPromise.then(self.getHead);
        self.nextPromise = self.nextPromise.then(self.getTail);
        return result;
    },
    _put: function(self, value) {
        var nextResolve = self.nextResolve;
        nextResolve({
            head: value,
            tail: self.newPromise()
        });
    }
};

Fifo.use = function(Promise) {
    return function(initialState) {
        return new Fifo(Promise, initialState);
    }
};

module.exports = Fifo;

