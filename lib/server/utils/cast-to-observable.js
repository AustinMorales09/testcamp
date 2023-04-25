"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = castToObservable;
var _rx = require("rx");
function castToObservable(maybe) {
  if (_rx.Observable.isObservable(maybe)) {
    return maybe;
  }
  if (_rx.helpers.isPromise(maybe)) {
    return _rx.Observable.fromPromise(maybe);
  }
  return _rx.Observable.of(maybe);
}