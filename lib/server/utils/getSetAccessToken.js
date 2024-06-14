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
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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