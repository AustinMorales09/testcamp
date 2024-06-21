"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decodeEmail = void 0;
exports.getEncodedEmail = getEncodedEmail;
exports.getWaitMessage = getWaitMessage;
exports.getWaitPeriod = getWaitPeriod;
exports.renderSignUpEmail = exports.renderSignInEmail = exports.renderEmailChangeEmail = void 0;
var _path = _interopRequireDefault(require("path"));
var _dedent = _interopRequireDefault(require("dedent"));
var _loopback = _interopRequireDefault(require("loopback"));
var _moment = _interopRequireDefault(require("moment"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const renderSignUpEmail = exports.renderSignUpEmail = _loopback.default.template(_path.default.join(__dirname, '..', '..', 'server', 'views', 'emails', 'user-request-sign-up.ejs'));
const renderSignInEmail = exports.renderSignInEmail = _loopback.default.template(_path.default.join(__dirname, '..', '..', 'server', 'views', 'emails', 'user-request-sign-in.ejs'));
const renderEmailChangeEmail = exports.renderEmailChangeEmail = _loopback.default.template(_path.default.join(__dirname, '..', '..', 'server', 'views', 'emails', 'user-request-update-email.ejs'));
function getWaitPeriod(ttl) {
  const fiveMinutesAgo = (0, _moment.default)().subtract(5, 'minutes');
  const lastEmailSentAt = (0, _moment.default)(new Date(ttl || null));
  const isWaitPeriodOver = ttl ? lastEmailSentAt.isBefore(fiveMinutesAgo) : true;
  if (!isWaitPeriodOver) {
    const minutesLeft = 5 - ((0, _moment.default)().minutes() - lastEmailSentAt.minutes());
    return minutesLeft;
  }
  return 0;
}
function getWaitMessage(ttl) {
  const minutesLeft = getWaitPeriod(ttl);
  if (minutesLeft <= 0) {
    return null;
  }
  const timeToWait = minutesLeft ? `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}` : 'a few seconds';
  return (0, _dedent.default)`
    Please wait ${timeToWait} to resend an authentication link.
  `;
}
function getEncodedEmail(email) {
  if (!email) {
    return null;
  }
  return Buffer.from(email).toString('base64');
}
const decodeEmail = email => Buffer.from(email, 'base64').toString();
exports.decodeEmail = decodeEmail;