"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validStripeForm = validStripeForm;
var _validator = require("validator");
var _donationSettings = require("../../../../config/donation-settings");
function validStripeForm(amount, duration, email) {
  return (0, _validator.isEmail)('' + email) && (0, _validator.isNumeric)('' + amount) && _donationSettings.durationKeysConfig.includes(duration) && duration === 'one-time' ? _donationSettings.donationOneTimeConfig.includes(amount) : _donationSettings.donationSubscriptionConfig.plans[duration];
}