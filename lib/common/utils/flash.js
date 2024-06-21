"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalizeAlertType = exports.alertTypes = void 0;
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const alertTypes = exports.alertTypes = _lodash.default.keyBy(['success', 'info', 'warning', 'danger'], _lodash.default.identity);
const normalizeAlertType = alertType => alertTypes[alertType] || 'info';
exports.normalizeAlertType = normalizeAlertType;