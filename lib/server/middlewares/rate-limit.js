"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rateLimitMiddleware;
var _expressRateLimit = _interopRequireDefault(require("express-rate-limit"));
var _rateLimitMongo = _interopRequireDefault(require("rate-limit-mongo"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const url = process.env.MONGODB || process.env.MONGOHQ_URL;

// Rate limit for mobile login
// 10 requests per 15 minute windows
function rateLimitMiddleware() {
  return (0, _expressRateLimit.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => {
      return req.headers['x-forwarded-for'] || 'localhost';
    },
    store: new _rateLimitMongo.default({
      collectionName: 'UserRateLimit',
      uri: url,
      expireTimeMs: 15 * 60 * 1000
    })
  });
}