"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCookieConfig = createCookieConfig;
exports.errorTypes = void 0;
exports.getAccessTokenFromRequest = getAccessTokenFromRequest;
exports.jwtCookieNS = void 0;
exports.removeCookies = removeCookies;
exports.setAccessTokenToResponse = setAccessTokenToResponse;
var _dateFns = require("date-fns");
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _secrets = require("../../../config/secrets");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const jwtCookieNS = exports.jwtCookieNS = 'jwt_access_token';
function createCookieConfig(req) {
  return {
    signed: !!req.signedCookies,
    domain: process.env.COOKIE_DOMAIN
  };
}
function setAccessTokenToResponse({
  accessToken
}, req, res, jwtSecret = _secrets.jwtSecret) {
  const cookieConfig = _objectSpread(_objectSpread({}, createCookieConfig(req)), {}, {
    maxAge: accessToken.ttl || 77760000000
  });
  const jwtAccess = _jsonwebtoken.default.sign({
    accessToken
  }, jwtSecret);
  res.cookie(jwtCookieNS, jwtAccess, cookieConfig);
  return;
}
function getAccessTokenFromRequest(req, jwtSecret = _secrets.jwtSecret) {
  const maybeToken = req.signedCookies && req.signedCookies[jwtCookieNS] || req.cookie && req.cookie[jwtCookieNS];
  if (!maybeToken) {
    return {
      accessToken: null,
      error: errorTypes.noTokenFound
    };
  }
  let token;
  try {
    token = _jsonwebtoken.default.verify(maybeToken, jwtSecret);
  } catch (err) {
    return {
      accessToken: null,
      error: errorTypes.invalidToken
    };
  }
  const {
    accessToken
  } = token;
  const {
    created,
    ttl
  } = accessToken;
  const valid = (0, _dateFns.isBefore)(Date.now(), Date.parse(created) + ttl);
  if (!valid) {
    return {
      accessToken: null,
      error: errorTypes.expiredToken
    };
  }
  return {
    accessToken,
    error: ''
  };
}
function removeCookies(req, res) {
  const config = createCookieConfig(req);
  res.clearCookie(jwtCookieNS, config);
  res.clearCookie('access_token', config);
  res.clearCookie('userId', config);
  res.clearCookie('_csrf', config);
  res.clearCookie('csrf_token', config);
  return;
}
const errorTypes = exports.errorTypes = {
  noTokenFound: 'No token found',
  invalidToken: 'Invalid token',
  expiredToken: 'Token timed out'
};