"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = passportLogin;
var _lodash = _interopRequireDefault(require("lodash"));
var _request = require("passport/lib/http/request");
var _rx = require("rx");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// make login polymorphic
// if supplied callback it works as normal
// if called without callback it returns an observable
// login(user, options?, cb?) => Void|Observable
function login$(...args) {
  if (_lodash.default.isFunction(_lodash.default.last(args))) {
    return _request.login.apply(this, args);
  }
  return _rx.Observable.fromNodeCallback(_request.login).apply(this, args);
}
function passportLogin() {
  return (req, res, next) => {
    req.login = req.logIn = login$;
    next();
  };
}