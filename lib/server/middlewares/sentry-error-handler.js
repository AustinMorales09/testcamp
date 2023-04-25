"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sentryErrorHandler;
exports.reportError = reportError;
var _node = require("@sentry/node");
var _secrets = require("../../../configs/secrets");
var _createHandledError = require("../utils/create-handled-error");
// sends directly to Sentry
function reportError(err) {
  return _secrets.sentry.dsn === 'dsn_from_sentry_dashboard' ? console.error(err) : (0, _node.captureException)(err);
}

// determines which errors should be reported
function sentryErrorHandler() {
  return _secrets.sentry.dsn === 'dsn_from_sentry_dashboard' ? (req, res, next) => next() : _node.Handlers.errorHandler({
    shouldHandleError(err) {
      // CSRF errors have status 403, consider ignoring them once csurf is
      // no longer rejecting people incorrectly.
      return !(0, _createHandledError.isHandledError)(err) && (!err.status || err.status >= 500);
    }
  });
}