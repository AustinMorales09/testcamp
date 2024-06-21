"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dayCount = dayCount;
var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// day count between two epochs (inclusive)
function dayCount([head, tail], timezone = 'UTC') {
  return Math.ceil((0, _momentTimezone.default)((0, _momentTimezone.default)(head).tz(timezone).endOf('day')).diff((0, _momentTimezone.default)(tail).tz(timezone).startOf('day'), 'days', true));
}