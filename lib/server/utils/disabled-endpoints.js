"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deprecatedEndpoint = deprecatedEndpoint;
exports.temporarilyDisabledEndpoint = temporarilyDisabledEndpoint;
function deprecatedEndpoint(_, res) {
  return res.status(410).json({
    message: {
      type: 'info',
      message: 'Please reload the app, this feature is no longer available.'
    }
  });
}
function temporarilyDisabledEndpoint(_, res) {
  return res.status(404).json({
    message: {
      type: 'info',
      message: 'Please reload the app, this feature is no longer available.'
    }
  });
}