module.exports.deferred = function deferred() {
  let deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject  = reject;
  });
  return deferred;
}

module.exports.delay = function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.isObject = function isObject(x) {
  return typeof x === 'object' && x !== null;
};

module.exports.lc = function lc(s) {
  return String(s).toLowerCase();
};
