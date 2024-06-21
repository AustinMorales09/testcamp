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
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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