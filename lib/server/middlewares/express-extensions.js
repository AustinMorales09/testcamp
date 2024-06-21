"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getExpressExtensions;
var _queryString = _interopRequireDefault(require("query-string"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// add rx methods to express
function getExpressExtensions() {
  return function expressExtensions(req, res, next) {
    res.redirectWithFlash = uri => {
      const flash = req.flash();
      res.redirect(`${uri}?${_queryString.default.stringify({
        messages: _queryString.default.stringify(flash, {
          arrayFormat: 'index'
        })
      }, {
        arrayFormat: 'index'
      })}`);
    };
    res.sendFlash = (type, message) => {
      if (type && message) {
        req.flash(type, message);
      }
      return res.json(req.flash());
    };
    next();
  };
}