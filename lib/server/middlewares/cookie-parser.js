"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const cookieSecret = process.env.COOKIE_SECRET;
var _default = exports.default = _cookieParser.default.bind(_cookieParser.default, cookieSecret);