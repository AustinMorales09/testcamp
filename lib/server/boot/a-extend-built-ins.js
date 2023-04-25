"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extendEmail;
var _rx = require("rx");
function extendEmail(app) {
  const {
    AccessToken,
    Email
  } = app.models;
  Email.send$ = _rx.Observable.fromNodeCallback(Email.send, Email);
  AccessToken.findOne$ = _rx.Observable.fromNodeCallback(AccessToken.findOne.bind(AccessToken));
  AccessToken.prototype.validate$ = _rx.Observable.fromNodeCallback(AccessToken.prototype.validate);
  AccessToken.prototype.destroy$ = _rx.Observable.fromNodeCallback(AccessToken.prototype.destroy);
}