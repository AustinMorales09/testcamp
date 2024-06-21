"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = prodErrorHandler;
var _accepts = _interopRequireDefault(require("accepts"));
var _createHandledError = require("../utils/create-handled-error.js");
var _redirection = require("../utils/redirection");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// import { inspect } from 'util';
// import _ from 'lodash/fp';

const errTemplate = (error, req) => {
  const {
    message,
    stack
  } = error;
  return `
Error: ${message}
Is authenticated user: ${!!req.user}
Headers: ${JSON.stringify(req.headers, null, 2)}
Original request: ${req.originalMethod} ${req.originalUrl}
Stack: ${stack}

// raw
${JSON.stringify(error, null, 2)}

`;
};
const isDev = process.env.FREECODECAMP_NODE_ENV !== 'production';
function prodErrorHandler() {
  // error handling in production.
  return function (err, req, res, _next) {
    // response for when req.body is bigger than body-parser's size limit
    if ((err === null || err === void 0 ? void 0 : err.type) === 'entity.too.large') {
      return res.status('413').send('Request payload is too large');
    }
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    const handled = (0, _createHandledError.unwrapHandledError)(err);
    // respect handled error status
    let status = handled.status || err.status || res.statusCode;
    if (!handled.status && status < 400) {
      status = 500;
    }
    res.status(status);

    // parse res type
    const accept = (0, _accepts.default)(req);
    // prioritise returning json
    const type = accept.type('json', 'html', 'text');
    const redirectTo = handled.redirectTo || `${origin}/`;
    const message = handled.message || 'Oops! Something went wrong. Please try again in a moment or contact support@freecodecamp.org if the error persists.';
    if (isDev) {
      console.error(errTemplate(err, req));
    }
    if (type === 'json') {
      return res.json({
        type: handled.type || 'danger',
        message
      });
    } else {
      if (typeof req.flash === 'function') {
        req.flash(handled.type || 'danger', message);
      }
      return res.redirectWithFlash(redirectTo);
    }
  };
}