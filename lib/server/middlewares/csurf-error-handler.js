"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = csrfErrorHandler;
var _csurf = require("./csurf.js");
function csrfErrorHandler() {
  return function (err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN' && req.csrfToken) {
      // use the middleware to generate a token. The client sends this back via
      // a header
      res.cookie('csrf_token', req.csrfToken(), _csurf.csrfOptions);
    }
    next(err);
  };
}