"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getEmailSender = getEmailSender;
function getEmailSender() {
  return process.env.SES_MAIL_FROM || 'team@freecodecamp.org';
}