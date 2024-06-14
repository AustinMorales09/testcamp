"use strict";

var _dedent = _interopRequireDefault(require("dedent"));
var _expressValidator = require("express-validator");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _passport = _interopRequireDefault(require("passport"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _validator = require("validator");
var _secrets = require("../../../config/secrets");
var _utils = require("../../common/utils");
var _componentPassport = require("../component-passport");
var _createHandledError = require("../utils/create-handled-error.js");
var _getSetAccessToken = require("../utils/getSetAccessToken");
var _middleware = require("../utils/middleware");
var _redirection = require("../utils/redirection");
var _userToken = require("../middlewares/user-token");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const passwordlessGetValidators = [(0, _expressValidator.check)('email').isBase64().withMessage('Email should be a base64 encoded string.'), (0, _expressValidator.check)('token').exists().withMessage('Token should exist.')
// based on strongloop/loopback/common/models/access-token.js#L15
.isLength({
  min: 64,
  max: 64
}).withMessage('Token is not the right length.')];
module.exports = function enableAuthentication(app) {
  // enable loopback access control authentication. see:
  // loopback.io/doc/en/lb2/Authentication-authorization-and-permissions.html
  app.enableAuth();
  const ifNotMobile = (0, _middleware.ifNotMobileRedirect)();
  const ifUserRedirect = (0, _middleware.ifUserRedirectTo)();
  const ifNoUserRedirect = (0, _middleware.ifNoUserRedirectHome)();
  const devSaveAuthCookies = (0, _componentPassport.devSaveResponseAuthCookies)();
  const devLoginSuccessRedirect = (0, _componentPassport.devLoginRedirect)();
  const api = app.loopback.Router();
  const deleteUserToken = (0, _userToken.createDeleteUserToken)(app);

  // Use a local mock strategy for signing in if we are in dev mode.
  // Otherwise we use auth0 login. We use a string for 'true' because values
  // set in the env file will always be strings and never boolean.
  if (process.env.LOCAL_MOCK_AUTH === 'true') {
    api.get('/signin', _passport.default.authenticate('devlogin'), devSaveAuthCookies, devLoginSuccessRedirect);
  } else {
    api.get('/signin', ifUserRedirect, (req, res, next) => {
      const {
        returnTo,
        origin,
        pathPrefix
      } = (0, _redirection.getRedirectParams)(req);
      const state = _jsonwebtoken.default.sign({
        returnTo,
        origin,
        pathPrefix
      }, _secrets.jwtSecret);
      return _passport.default.authenticate('auth0-login', {
        state
      })(req, res, next);
    });
    api.get('/auth/auth0/callback', (0, _componentPassport.createPassportCallbackAuthenticator)('auth0-login', {
      provider: 'auth0'
    }));
  }
  api.get('/signout', deleteUserToken, (req, res) => {
    const {
      origin,
      returnTo
    } = (0, _redirection.getRedirectParams)(req);
    req.logout();
    req.session.destroy(err => {
      if (err) {
        throw (0, _createHandledError.wrapHandledError)(new Error('could not destroy session'), {
          type: 'info',
          message: 'We could not log you out, please try again in a moment.',
          redirectTo: origin
        });
      }
      (0, _getSetAccessToken.removeCookies)(req, res);
      res.redirect(returnTo);
    });
  });
  api.get('/confirm-email', ifNoUserRedirect, passwordlessGetValidators, createGetPasswordlessAuth(app));
  api.get('/mobile-login', ifNotMobile, ifUserRedirect, mobileLogin(app));
  app.use(api);
};
const defaultErrorMsg = (0, _dedent.default)`
    Oops, something is not right,
    please request a fresh link to sign in / sign up.
  `;
function createGetPasswordlessAuth(app) {
  const {
    models: {
      AuthToken,
      User
    }
  } = app;
  return function getPasswordlessAuth(req, res, next) {
    const {
      query: {
        email: encodedEmail,
        token: authTokenId,
        emailChange
      } = {}
    } = req;
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    const email = (0, _utils.decodeEmail)(encodedEmail);
    if (!(0, _validator.isEmail)(email)) {
      return next((0, _createHandledError.wrapHandledError)(new TypeError('decoded email is invalid'), {
        type: 'info',
        message: 'The email encoded in the link is incorrectly formatted',
        redirectTo: `${origin}/signin`
      }));
    }
    // first find
    return AuthToken.findOne$({
      where: {
        id: authTokenId
      }
    }).flatMap(authToken => {
      if (!authToken) {
        throw (0, _createHandledError.wrapHandledError)(new Error(`no token found for id: ${authTokenId}`), {
          type: 'info',
          message: defaultErrorMsg,
          redirectTo: `${origin}/signin`
        });
      }
      // find user then validate and destroy email validation token
      // finally return user instance
      return User.findOne$({
        where: {
          id: authToken.userId
        }
      }).flatMap(user => {
        if (!user) {
          throw (0, _createHandledError.wrapHandledError)(new Error(`no user found for token: ${authTokenId}`), {
            type: 'info',
            message: defaultErrorMsg,
            redirectTo: `${origin}/signin`
          });
        }
        if (user.email !== email) {
          if (!emailChange || emailChange && user.newEmail !== email) {
            throw (0, _createHandledError.wrapHandledError)(new Error('user email does not match'), {
              type: 'info',
              message: defaultErrorMsg,
              redirectTo: `${origin}/signin`
            });
          }
        }
        return authToken.validate$().map(isValid => {
          if (!isValid) {
            throw (0, _createHandledError.wrapHandledError)(new Error('token is invalid'), {
              type: 'info',
              message: `
                        Looks like the link you clicked has expired,
                        please request a fresh link, to sign in.
                      `,
              redirectTo: `${origin}/signin`
            });
          }
          return authToken.destroy$();
        }).map(() => user);
      });
    })
    // at this point token has been validated and destroyed
    // update user and log them in
    .map(user => user.loginByRequest(req, res)).do(() => {
      if (emailChange) {
        req.flash('success', 'flash.email-valid');
      } else {
        req.flash('success', 'flash.signin-success');
      }
      return res.redirectWithFlash(`${origin}/learn`);
    }).subscribe(() => {}, next);
  };
}
function mobileLogin(app) {
  const {
    models: {
      User
    }
  } = app;
  return async function getPasswordlessAuth(req, res, next) {
    try {
      const auth0Res = await (0, _nodeFetch.default)(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });
      if (!auth0Res.ok) {
        return next((0, _createHandledError.wrapHandledError)(new Error('Invalid Auth0 token'), {
          type: 'danger',
          message: 'We could not log you in, please try again in a moment.',
          status: auth0Res.status
        }));
      }
      const {
        email
      } = await auth0Res.json();
      if (typeof email !== 'string' || !(0, _validator.isEmail)(email)) {
        return next((0, _createHandledError.wrapHandledError)(new TypeError('decoded email is invalid'), {
          type: 'danger',
          message: 'The email is incorrectly formatted',
          status: 400
        }));
      }
      User.findOne$({
        where: {
          email
        }
      }).do(async user => {
        if (!user) {
          user = await User.create({
            email
          });
        }
        await user.mobileLoginByRequest(req, res);
        res.end();
      }).subscribe(() => {}, next);
    } catch (err) {
      next(err);
    }
  };
}