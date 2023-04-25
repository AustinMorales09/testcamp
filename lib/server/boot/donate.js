"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = donateBoot;
var _debug = _interopRequireDefault(require("debug"));
var _stripe = _interopRequireDefault(require("stripe"));
var _donationSettings = require("../../../../config/donation-settings");
var _secrets = _interopRequireDefault(require("../../../../config/secrets"));
var _donation = require("../utils/donation");
var _stripeHelpers = require("../utils/stripeHelpers");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const log = (0, _debug.default)('fcc:boot:donate');
function donateBoot(app, done) {
  let stripe = false;
  const {
    User
  } = app.models;
  const api = app.loopback.Router();
  const hooks = app.loopback.Router();
  const donateRouter = app.loopback.Router();
  function connectToStripe() {
    return new Promise(function () {
      // connect to stripe API
      stripe = (0, _stripe.default)(_secrets.default.stripe.secret);
    });
  }
  async function handleStripeCardDonation(req, res) {
    return (0, _donation.createStripeCardDonation)(req, res, stripe, app).catch(err => {
      if (err.type === 'AlreadyDonatingError' || err.type === 'UserActionRequired' || err.type === 'PaymentMethodRequired') {
        return res.status(402).send({
          error: err
        });
      }
      if (err.type === 'InvalidRequest') return res.status(400).send({
        error: err
      });
      return res.status(500).send({
        error: 'Donation failed due to a server error.'
      });
    });
  }
  function createStripeDonation(req, res) {
    const {
      user,
      body
    } = req;
    const {
      amount,
      duration,
      token: {
        id
      },
      email,
      name
    } = body;
    if (!(0, _stripeHelpers.validStripeForm)(amount, duration, email)) {
      return res.status(500).send({
        error: 'The donation form had invalid values for this submission.'
      });
    }
    const fccUser = user ? Promise.resolve(user) : new Promise((resolve, reject) => User.findOrCreate({
      where: {
        email
      }
    }, {
      email
    }, (err, instance) => {
      if (err) {
        return reject(err);
      }
      return resolve(instance);
    }));
    let donatingUser = {};
    let donation = {
      email,
      amount,
      duration,
      provider: 'stripe',
      startDate: new Date(Date.now()).toISOString()
    };
    const createCustomer = async user => {
      let customer;
      donatingUser = user;
      try {
        customer = await stripe.customers.create({
          email,
          card: id,
          name
        });
      } catch (err) {
        throw new Error('Error creating stripe customer');
      }
      log(`Stripe customer with id ${customer.id} created`);
      return customer;
    };
    const createSubscription = async customer => {
      donation.customerId = customer.id;
      let sub;
      try {
        sub = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{
            plan: `${_donationSettings.donationSubscriptionConfig.duration[duration].toLowerCase()}-donation-${amount}`
          }]
        });
      } catch (err) {
        throw new Error('Error creating stripe subscription');
      }
      return sub;
    };
    const createAsyncUserDonation = () => {
      donatingUser.createDonation(donation).toPromise().catch(err => {
        throw new Error(err);
      });
    };
    return Promise.resolve(fccUser).then(nonDonatingUser => {
      // the logic is removed since users can donate without an account
      return nonDonatingUser;
    }).then(createCustomer).then(customer => {
      return createSubscription(customer).then(subscription => {
        log(`Stripe subscription with id ${subscription.id} created`);
        donation.subscriptionId = subscription.id;
        return res.send(subscription);
      });
    }).then(createAsyncUserDonation).catch(err => {
      if (err.type === 'StripeCardError' || err.type === 'AlreadyDonatingError') {
        return res.status(402).send({
          error: err.message
        });
      }
      return res.status(500).send({
        error: 'Donation failed due to a server error.'
      });
    });
  }
  function addDonation(req, res) {
    const {
      user,
      body
    } = req;
    if (!user || !body) {
      return res.status(500).json({
        error: 'User must be signed in for this request.'
      });
    }
    return Promise.resolve(req).then(user.updateAttributes({
      isDonating: true
    })).then(() => res.status(200).json({
      isDonating: true
    })).catch(err => {
      log(err.message);
      return res.status(500).json({
        type: 'danger',
        message: 'Something went wrong.'
      });
    });
  }
  function updatePaypal(req, res) {
    const {
      headers,
      body
    } = req;
    return Promise.resolve(req).then(_donation.verifyWebHookType).then(_donation.getAsyncPaypalToken).then(token => (0, _donation.verifyWebHook)(headers, body, token, _secrets.default.paypal.webhookId)).then(hookBody => (0, _donation.updateUser)(hookBody, app)).catch(err => {
      // Todo: This probably need to be thrown and caught in error handler
      log(err.message);
    }).finally(() => res.status(200).json({
      message: 'received paypal hook'
    }));
  }
  const stripeKey = _secrets.default.stripe.public;
  const secKey = _secrets.default.stripe.secret;
  const paypalKey = _secrets.default.paypal.client;
  const paypalSec = _secrets.default.paypal.secret;
  const stripeSecretInvalid = !secKey || secKey === 'sk_from_stripe_dashboard';
  const stripPublicInvalid = !stripeKey || stripeKey === 'pk_from_stripe_dashboard';
  const paypalSecretInvalid = !paypalKey || paypalKey === 'id_from_paypal_dashboard';
  const paypalPublicInvalid = !paypalSec || paypalSec === 'secret_from_paypal_dashboard';
  const stripeInvalid = stripeSecretInvalid || stripPublicInvalid;
  const paypalInvalid = paypalPublicInvalid || paypalSecretInvalid;
  if (stripeInvalid || paypalInvalid) {
    if (process.env.FREECODECAMP_NODE_ENV === 'production') {
      throw new Error('Donation API keys are required to boot the server!');
    }
    log('Donation disabled in development unless ALL test keys are provided');
    done();
  } else {
    api.post('/charge-stripe', createStripeDonation);
    api.post('/charge-stripe-card', handleStripeCardDonation);
    api.post('/add-donation', addDonation);
    hooks.post('/update-paypal', updatePaypal);
    donateRouter.use('/donate', api);
    donateRouter.use('/hooks', hooks);
    app.use(donateRouter);
    connectToStripe(stripe).then(done);
    done();
  }
}