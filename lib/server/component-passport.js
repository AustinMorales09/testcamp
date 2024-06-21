"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.devSaveResponseAuthCookies = exports.devLoginRedirect = exports.createPassportCallbackAuthenticator = void 0;
exports.setupPassport = setupPassport;
var _loopbackComponentPassport = require("@freecodecamp/loopback-component-passport");
var _dedent = _interopRequireDefault(require("dedent"));
var _passport = _interopRequireDefault(require("passport"));
var _i18n = require("../../../shared/config/i18n");
var _secrets = require("../../config/secrets");
var _passportProviders = _interopRequireDefault(require("./passport-providers"));
var _getSetAccessToken = require("./utils/getSetAccessToken");
var _redirection = require("./utils/redirection");
var _userStats = require("./utils/user-stats");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const passportOptions = {
  emailOptional: true,
  profileToUser: null
};
_loopbackComponentPassport.PassportConfigurator.prototype.init = function passportInit(noSession) {
  this.app.middleware('session:after', _passport.default.initialize());
  if (noSession) {
    return;
  }
  this.app.middleware('session:after', _passport.default.session());

  // Serialization and deserialization is only required if passport session is
  // enabled

  _passport.default.serializeUser((user, done) => done(null, user.id));
  _passport.default.deserializeUser(async (id, done) => {
    const user = await (0, _userStats.getUserById)(id).catch(done);
    return done(null, user);
  });
};
function setupPassport(app) {
  const configurator = new _loopbackComponentPassport.PassportConfigurator(app);
  configurator.setupModels({
    userModel: app.models.user,
    userIdentityModel: app.models.userIdentity,
    userCredentialModel: app.models.userCredential
  });
  configurator.init();
  Object.keys(_passportProviders.default).map(function (strategy) {
    let config = _passportProviders.default[strategy];
    config.session = config.session !== false;
    config.customCallback = !config.useCustomCallback ? null : createPassportCallbackAuthenticator(strategy, config);
    configurator.configureProvider(strategy, _objectSpread(_objectSpread({}, config), passportOptions));
  });
}
const devSaveResponseAuthCookies = () => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.redirect('/signin');
    }
    const {
      accessToken
    } = user;
    (0, _getSetAccessToken.setAccessTokenToResponse)({
      accessToken
    }, req, res);
    return next();
  };
};
exports.devSaveResponseAuthCookies = devSaveResponseAuthCookies;
const devLoginRedirect = () => {
  return (req, res) => {
    // this mirrors the production approach, but only validates the prefix
    let {
      returnTo,
      origin,
      pathPrefix
    } = (0, _redirection.getRedirectParams)(req, ({
      returnTo,
      origin,
      pathPrefix
    }) => {
      pathPrefix = _i18n.availableLangs.client.includes(pathPrefix) ? pathPrefix : '';
      return {
        returnTo,
        origin,
        pathPrefix
      };
    });

    // if returnTo has a trailing slash, we need to remove it before comparing
    // it to the prefixed landing path
    if (returnTo.slice(-1) === '/') {
      returnTo = returnTo.slice(0, -1);
    }
    const redirectBase = (0, _redirection.getPrefixedLandingPath)(origin, pathPrefix);
    returnTo += (0, _redirection.haveSamePath)(redirectBase, returnTo) ? '/learn' : '';
    return res.redirect(returnTo);
  };
};
exports.devLoginRedirect = devLoginRedirect;
const createPassportCallbackAuthenticator = (strategy, config) => (req, res, next) => {
  return _passport.default.authenticate(strategy, {
    session: false
  }, (err, user, userInfo) => {
    if (err) {
      return next(err);
    }
    const state = req && req.query && req.query.state;
    // returnTo, origin and pathPrefix are audited by getReturnTo
    let {
      returnTo,
      origin,
      pathPrefix
    } = (0, _redirection.getReturnTo)(state, _secrets.jwtSecret);
    const redirectBase = (0, _redirection.getPrefixedLandingPath)(origin, pathPrefix);
    const {
      error,
      error_description
    } = req.query;
    if (error === 'access_denied') {
      const blockedByLaw = error_description === 'Access denied from your location';

      // Do not show any error message, instead redirect to the blocked page, with details.
      if (blockedByLaw) {
        return res.redirectWithFlash(`${redirectBase}/blocked`);
      }
      req.flash('info', (0, _dedent.default)`${error_description}.`);
      return res.redirectWithFlash(`${redirectBase}/learn`);
    }
    if (!user || !userInfo) {
      return res.redirect('/signin');
    }
    const {
      accessToken
    } = userInfo;
    const {
      provider
    } = config;
    if (accessToken && accessToken.id) {
      if (provider === 'auth0') {
        req.flash('success', 'flash.signin-success');
      } else if (user.email) {
        req.flash('info', (0, _dedent.default)`
We are moving away from social authentication for privacy reasons. Next time
we recommend using your email address: ${user.email} to sign in instead.
            `);
      }
      (0, _getSetAccessToken.setAccessTokenToResponse)({
        accessToken
      }, req, res);
      req.login(user);
    }

    // TODO: getReturnTo could return a success flag to show a flash message,
    // but currently it immediately gets overwritten by a second message. We
    // should either change the message if the flag is present or allow
    // multiple messages to appear at once.

    if (user.acceptedPrivacyTerms) {
      // if returnTo has a trailing slash, we need to remove it before comparing
      // it to the prefixed landing path
      if (returnTo.slice(-1) === '/') {
        returnTo = returnTo.slice(0, -1);
      }
      returnTo += (0, _redirection.haveSamePath)(redirectBase, returnTo) ? '/learn' : '';
      return res.redirectWithFlash(returnTo);
    } else {
      return res.redirectWithFlash(`${redirectBase}/email-sign-up`);
    }
  })(req, res, next);
};
exports.createPassportCallbackAuthenticator = createPassportCallbackAuthenticator;