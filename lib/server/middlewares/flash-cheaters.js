"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = flashCheaters;
var _dedent = _interopRequireDefault(require("dedent"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const ALLOWED_METHODS = ['GET'];
const EXCLUDED_PATHS = ['/api/flyers/findOne', '/challenges/current-challenge', '/challenges/next-challenge', '/map-aside', '/signout'];
function flashCheaters() {
  return function (req, res, next) {
    if (ALLOWED_METHODS.indexOf(req.method) !== -1 && EXCLUDED_PATHS.indexOf(req.path) === -1 && req.user && req.url !== '/' && req.user.isCheater) {
      req.flash('danger', (0, _dedent.default)`
          Upon review, this account has been flagged for academic
          dishonesty. If you’re the owner of this account contact
          team@freecodecamp.org for details.
        `);
    }
    return next();
  };
}