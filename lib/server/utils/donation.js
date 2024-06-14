"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.capitalizeKeys = capitalizeKeys;
exports.createAsyncUserDonation = void 0;
exports.createStripeCardDonation = createStripeCardDonation;
exports.handleStripeCardUpdateSession = handleStripeCardUpdateSession;
var _debug = _interopRequireDefault(require("debug"));
var _donationSettings = require("../../../../shared/config/donation-settings");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /* eslint-disable camelcase */
const log = (0, _debug.default)('fcc:boot:donate');
function capitalizeKeys(object) {
  Object.keys(object).forEach(function (key) {
    object[key.toUpperCase()] = object[key];
  });
}
const createAsyncUserDonation = (user, donation) => {
  log(`Creating donation:${donation.subscriptionId}`);
  // log user donation
  user.createDonation(donation).toPromise().catch(err => {
    throw new Error(err);
  });
};
exports.createAsyncUserDonation = createAsyncUserDonation;
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

  /*
   * card donations is blocked for new users
   */

  const threeChallengesCompleted = user.completedChallenges.length >= 3;
  if (!threeChallengesCompleted) {
    throw {
      message: `Donate using another method`,
      type: 'MethodRestrictionError'
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
async function handleStripeCardUpdateSession(req, app, stripe) {
  const {
    user: {
      id
    }
  } = req;
  const {
    Donation
  } = app.models;
  log('Updating stripe card for user: ', id);

  // multiple donations support should be added
  const donation = await Donation.findOne({
    where: {
      userId: id,
      provider: 'stripe'
    }
  });
  if (!donation) throw Error('Stripe donation record not found');
  const {
    customerId,
    subscriptionId
  } = donation;
  log(subscriptionId);

  // Create a Stripe checkout session
  // updating customer payment method is handled by webhook handler
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'setup',
    customer: customerId,
    setup_intent_data: {
      metadata: {
        customer_id: customerId,
        subscription_id: subscriptionId
      }
    },
    success_url: `${process.env.HOME_LOCATION}/update-stripe-card?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.HOME_LOCATION}/update-stripe-card`
  });
  return {
    sessionId: session.id
  };
}