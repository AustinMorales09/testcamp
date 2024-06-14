"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.observeMethod = observeMethod;
exports.observeQuery = observeQuery;
exports.saveInstance = saveInstance;
exports.saveUser = void 0;
exports.timeCache = timeCache;
var _debug = _interopRequireDefault(require("debug"));
var _moment = _interopRequireDefault(require("moment"));
var _rx = _interopRequireWildcard(require("rx"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const debug = (0, _debug.default)('fcc:rxUtils');
function saveInstance(instance) {
  return new _rx.default.Observable.create(function (observer) {
    if (!instance || typeof instance.save !== 'function') {
      debug('no instance or save method');
      observer.onNext();
      return observer.onCompleted();
    }
    return instance.save(function (err, savedInstance) {
      if (err) {
        return observer.onError(err);
      }
      debug('instance saved');
      observer.onNext(savedInstance);
      return observer.onCompleted();
    });
  });
}

// alias saveInstance
const saveUser = exports.saveUser = saveInstance;

// observeQuery(Model: Object, methodName: String, query: Any) => Observable
function observeQuery(Model, methodName, query) {
  return _rx.default.Observable.fromNodeCallback(Model[methodName], Model)(query);
}

// observeMethod(
//   context: Object, methodName: String
// ) => (query: Any) => Observable
function observeMethod(context, methodName) {
  return _rx.default.Observable.fromNodeCallback(context[methodName], context);
}

// must be bound to an observable instance
// timeCache(amount: Number, unit: String) => Observable
function timeCache(time, unit) {
  const source = this;
  let cache;
  let expireCacheAt;
  return _rx.Observable.create(observable => {
    // if there is no expire time set
    // or if expireCacheAt is smaller than now,
    // set new expire time in MS and create new subscription to source
    if (!expireCacheAt || expireCacheAt < Date.now()) {
      // set expire in ms;
      expireCacheAt = (0, _moment.default)().add(time, unit).valueOf();
      cache = new _rx.AsyncSubject();
      source.subscribe(cache);
    }
    return cache.subscribe(observable);
  });
}