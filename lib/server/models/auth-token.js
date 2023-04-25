"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeAuthToken;
var _rx = require("rx");
function initializeAuthToken(AuthToken) {
  AuthToken.on('dataSourceAttached', () => {
    AuthToken.findOne$ = _rx.Observable.fromNodeCallback(AuthToken.findOne.bind(AuthToken));
    AuthToken.prototype.validate$ = _rx.Observable.fromNodeCallback(AuthToken.prototype.validate);
    AuthToken.prototype.destroy$ = _rx.Observable.fromNodeCallback(AuthToken.prototype.destroy);
  });
}