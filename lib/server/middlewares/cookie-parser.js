"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cookieParser = _interopRequireDefault(require("cookie-parser"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const cookieSecret = process.env.COOKIE_SECRET;
var _default = _cookieParser.default.bind(_cookieParser.default, cookieSecret);
exports.default = _default;