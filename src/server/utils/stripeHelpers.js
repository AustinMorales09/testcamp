import { isEmail, isNumeric } from 'validator';
import {
  durationKeysConfig,
  donationOneTimeConfig,
  donationSubscriptionConfig
} from '../../../configs/donation-settings';

export function validStripeForm(amount, duration, email) {
  return isEmail('' + email) &&
    isNumeric('' + amount) &&
    durationKeysConfig.includes(duration) &&
    duration === 'one-time'
    ? donationOneTimeConfig.includes(amount)
    : donationSubscriptionConfig.plans[duration];
}
