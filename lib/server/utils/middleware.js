"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValidatorErrorHandler = void 0;
exports.ifNoUser401 = ifNoUser401;
exports.ifNoUserRedirectHome = ifNoUserRedirectHome;
exports.ifNoUserSend = ifNoUserSend;
exports.ifNotMobileRedirect = ifNotMobileRedirect;
exports.ifNotVerifiedRedirectToUpdateEmail = ifNotVerifiedRedirectToUpdateEmail;
exports.ifUserRedirectTo = ifUserRedirectTo;
var _dedent = _interopRequireDefault(require("dedent"));
var _expressValidator = require("express-validator");
var _createHandledError = require("./create-handled-error.js");
var _getSetAccessToken = require("./getSetAccessToken.js");
var _redirection = require("./redirection");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ifNoUserRedirectHome(message, type = 'errors') {
  return function (req, res, next) {
    const {
      path
    } = req;
    if (req.user) {
      return next();
    }
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    req.flash(type, message || `You must be signed in to access ${path}`);
    return res.redirect(origin);
  };
}
function ifNoUserSend(sendThis) {
  return function (req, res, next) {
    if (req.user) {
      return next();
    }
    return res.status(200).send(sendThis);
  };
}
function ifNoUser401(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.status(401).end();
}
function ifNotVerifiedRedirectToUpdateEmail(req, res, next) {
  const {
    user
  } = req;
  if (!user) {
    return next();
  }
  if (!user.emailVerified) {
    req.flash('danger', (0, _dedent.default)`
        We do not have your verified email address on record,
        please add it in the settings to continue with your request.
      `);
    return res.redirect('/settings');
  }
  return next();
}
function ifUserRedirectTo(status) {
  status = status === 301 ? 301 : 302;
  return (req, res, next) => {
    const {
      accessToken
    } = (0, _getSetAccessToken.getAccessTokenFromRequest)(req);
    const {
      returnTo
    } = (0, _redirection.getRedirectParams)(req);
    if (req.user && accessToken) {
      return res.status(status).redirect(returnTo);
    }
    if (req.user && !accessToken) {
      // This request has an active auth session
      // but there is no accessToken attached to the request
      // perhaps the user cleared cookies?
      // we need to remove the zombie auth session
      (0, _getSetAccessToken.removeCookies)(req, res);
      delete req.session.passport;
    }
    return next();
  };
}
function ifNotMobileRedirect() {
  return (req, res, next) => {
    //
    // Todo: Use the below check once we have done more research on usage
    //
    // const isMobile = /(iPhone|iPad|Android)/.test(req.headers['user-agent']);
    // if (!isMobile) {
    //  res.json({ error: 'not from mobile' });
    // } else {
    //  next();
    // }
    next();
  };
}
// for use with express-validator error formatter
const createValidatorErrorHandler = (...args) => (req, res, next) => {
  const validation = (0, _expressValidator.validationResult)(req).formatWith((0, _createHandledError.createValidatorErrorFormatter)(...args));
  if (!validation.isEmpty()) {
    const errors = validation.array();
    return next(errors.pop());
  }
  return next();
};
exports.createValidatorErrorHandler = createValidatorErrorHandler;