"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cancelDonation = cancelDonation;
exports.capitalizeKeys = capitalizeKeys;
exports.createAsyncUserDonation = void 0;
exports.createDonation = createDonation;
exports.createDonationObj = createDonationObj;
exports.createStripeCardDonation = createStripeCardDonation;
exports.getAsyncPaypalToken = getAsyncPaypalToken;
exports.updateUser = updateUser;
exports.verifyWebHook = verifyWebHook;
exports.verifyWebHookType = verifyWebHookType;
var _axios = _interopRequireDefault(require("axios"));
var _debug = _interopRequireDefault(require("debug"));
var _isEmail = _interopRequireDefault(require("validator/lib/isEmail"));
var _donationSettings = require("../../../../config/donation-settings");
var _secrets = _interopRequireDefault(require("../../../../config/secrets"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /* eslint-disable camelcase */
const log = (0, _debug.default)('fcc:boot:donate');
const paypalVerifyWebhookURL = _secrets.default.paypal.verifyWebhookURL || `https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature`;
const paypalTokenURL = _secrets.default.paypal.tokenUrl || `https://api.sandbox.paypal.com/v1/oauth2/token`;
async function getAsyncPaypalToken() {
  const res = await _axios.default.post(paypalTokenURL, null, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    auth: {
      username: _secrets.default.paypal.client,
      password: _secrets.default.paypal.secret
    },
    params: {
      grant_type: 'client_credentials'
    }
  });
  return res.data.access_token;
}
function capitalizeKeys(object) {
  Object.keys(object).forEach(function (key) {
    object[key.toUpperCase()] = object[key];
  });
}
async function verifyWebHook(headers, body, token, webhookId) {
  var webhookEventBody = typeof body === 'string' ? JSON.parse(body) : body;
  capitalizeKeys(headers);
  const payload = {
    auth_algo: headers['PAYPAL-AUTH-ALGO'],
    cert_url: headers['PAYPAL-CERT-URL'],
    transmission_id: headers['PAYPAL-TRANSMISSION-ID'],
    transmission_sig: headers['PAYPAL-TRANSMISSION-SIG'],
    transmission_time: headers['PAYPAL-TRANSMISSION-TIME'],
    webhook_id: webhookId,
    webhook_event: webhookEventBody
  };
  const response = await _axios.default.post(paypalVerifyWebhookURL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  if (response.data.verification_status === 'SUCCESS') {
    return body;
  } else {
    throw {
      // if verification fails, throw token verification error
      message: `Failed token verification.`,
      type: 'FailedPaypalTokenVerificationError'
    };
  }
}
function verifyWebHookType(req) {
  // check if webhook type for creation
  const {
    body: {
      event_type
    }
  } = req;
  if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || event_type === 'BILLING.SUBSCRIPTION.CANCELLED') return req;else throw {
    message: 'Webhook type is not supported',
    type: 'UnsupportedWebhookType'
  };
}
const createAsyncUserDonation = (user, donation) => {
  log(`Creating donation:${donation.subscriptionId}`);
  // log user donation
  user.createDonation(donation).toPromise().catch(err => {
    throw new Error(err);
  });
};
exports.createAsyncUserDonation = createAsyncUserDonation;
function createDonationObj(body) {
  // creates donation object
  const {
    resource: {
      id,
      status_update_time,
      subscriber: {
        email_address
      } = {
        email_address: null
      }
    }
  } = body;
  let donation = {
    email: email_address,
    amount: 500,
    duration: 'month',
    provider: 'paypal',
    subscriptionId: id,
    customerId: email_address,
    startDate: new Date(status_update_time).toISOString()
  };
  return donation;
}
function createDonation(body, app) {
  const {
    User
  } = app.models;
  const {
    resource: {
      subscriber: {
        email_address
      } = {
        email_address: null
      }
    }
  } = body;
  let donation = createDonationObj(body);
  let email = email_address;
  if (!email || !(0, _isEmail.default)(email)) {
    throw {
      message: 'Paypal webhook email is not valid',
      type: 'InvalidPaypalWebhookEmail'
    };
  }
  return User.findOne({
    where: {
      email
    }
  }, (err, user) => {
    if (err) throw new Error(err);
    if (!user) {
      log(`Creating new user:${email}`);
      return User.create({
        email
      }).then(user => {
        createAsyncUserDonation(user, donation);
      }).catch(err => {
        throw {
          message: err.message || 'findOne Donation records with email failed',
          type: err.name || 'FailedFindingOneDonationEmail'
        };
      });
    }
    return createAsyncUserDonation(user, donation);
  });
}
async function cancelDonation(body, app) {
  const {
    resource: {
      id,
      status_update_time = new Date(Date.now()).toISOString()
    }
  } = body;
  const {
    Donation
  } = app.models;
  Donation.findOne({
    where: {
      subscriptionId: id
    }
  }, (err, donation) => {
    if (err) throw {
      message: err.message || 'findOne Donation records with subscriptionId failed',
      type: err.name || 'FailedFindingOneSubscriptionId'
    };
    if (!donation) throw {
      message: 'Donation record with provided subscription id is not found',
      type: 'SubscriptionIdNotFound'
    };
    log(`Updating donation record: ${donation.subscriptionId}`);
    donation.updateAttributes({
      endDate: new Date(status_update_time).toISOString()
    });
  });
}
async function updateUser(body, app) {
  const {
    event_type
  } = body;
  if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    // update user status based on new billing subscription events
    createDonation(body, app);
  } else if (event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    cancelDonation(body, app);
  } else throw {
    message: 'Webhook type is not supported',
    type: 'UnsupportedWebhookType'
  };
}
async function createStripeCardDonation(req, res, stripe) {
  const {
    body: {
      paymentMethodId,
      amount,
      duration
    },
    user: {
      name,
      id: userId,
      email
    },
    user
  } = req;
  if (!paymentMethodId || !amount || !duration || !userId || !email) {
    throw {
      message: 'Request is not valid',
      type: 'InvalidRequest'
    };
  }

  /*
   * if user is already donating and the donation isn't one time only,
   * throw error
   */
  if (user.isDonating && duration !== 'one-time') {
    throw {
      message: `User already has active recurring donation(s).`,
      type: 'AlreadyDonatingError'
    };
  }
  let customerId;
  try {
    const customer = await stripe.customers.create(_objectSpread({
      email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    }, name && {
      name
    }));
    customerId = customer === null || customer === void 0 ? void 0 : customer.id;
  } catch {
    throw {
      type: 'customerCreationFailed',
      message: 'Failed to create stripe customer'
    };
  }
  log(`Stripe customer with id ${customerId} created`);
  let subscriptionId;
  try {
    const {
      id: subscription_id,
      latest_invoice: {
        payment_intent: {
          client_secret,
          status: intent_status
        }
      }
    } = await stripe.subscriptions.create({
      // create Stripe subscription
      customer: customerId,
      payment_behavior: 'allow_incomplete',
      items: [{
        plan: `${_donationSettings.donationSubscriptionConfig.duration[duration].toLowerCase()}-donation-${amount}`
      }],
      expand: ['latest_invoice.payment_intent']
    });
    if (intent_status === 'requires_source_action') throw {
      type: 'UserActionRequired',
      message: 'Payment requires user action',
      client_secret
    };else if (intent_status === 'requires_source') throw {
      type: 'PaymentMethodRequired',
      message: 'Card has been declined'
    };
    subscriptionId = subscription_id;
  } catch (err) {
    if (err.type === 'UserActionRequired' || err.type === 'PaymentMethodRequired') throw err;else throw {
      type: 'SubscriptionCreationFailed',
      message: 'Failed to create stripe subscription'
    };
  }
  log(`Stripe subscription with id ${subscriptionId} created`);

  // save Donation
  let donation = {
    email,
    amount,
    duration,
    provider: 'stripe',
    subscriptionId,
    customerId,
    startDate: new Date().toISOString()
  };
  await createAsyncUserDonation(user, donation);
  return res.status(200).json({
    isDonating: true
  });
}