"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sentryRequestHandler;
var _node = require("@sentry/node");
var _secrets = require("../../../config/secrets");
function sentryRequestHandler() {
  return _secrets.sentry.dsn === 'dsn_from_sentry_dashboard' ? (req, res, next) => next() : _node.Handlers.requestHandler();
}