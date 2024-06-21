"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeDonation;
var _debug = _interopRequireDefault(require("debug"));
var _rx = require("rx");
var _sentryErrorHandler = require("../middlewares/sentry-error-handler.js");
var _inMemoryCache = _interopRequireDefault(require("../utils/in-memory-cache"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const log = (0, _debug.default)('fcc:boot:donate');
const fiveMinutes = 1000 * 60 * 5;
function initializeDonation(Donation) {
  let activeDonationUpdateInterval = null;
  const activeDonationCountCacheTTL = fiveMinutes;
  const activeDonationCountCache = (0, _inMemoryCache.default)(0, _sentryErrorHandler.reportError);
  const activeDonationsQuery$ = () => Donation.find$({
    // eslint-disable-next-line no-undefined
    where: {
      endDate: undefined
    }
  }).map(instances => instances.length);
  function cleanUp() {
    if (activeDonationUpdateInterval) {
      clearInterval(activeDonationUpdateInterval);
    }
    return;
  }
  process.on('exit', cleanUp);
  Donation.on('dataSourceAttached', () => {
    Donation.find$ = _rx.Observable.fromNodeCallback(Donation.find.bind(Donation));
    Donation.findOne$ = _rx.Observable.fromNodeCallback(Donation.findOne.bind(Donation));
    seedTheCache().then(setupCacheUpdateInterval).catch(err => {
      const errMsg = `Error caught seeding the cache: ${err.message}`;
      err.message = errMsg;
      (0, _sentryErrorHandler.reportError)(err);
    });
  });
  function seedTheCache() {
    return new Promise((resolve, reject) => _rx.Observable.defer(activeDonationsQuery$).subscribe(count => {
      log('activeDonor count: %d', count);
      activeDonationCountCache.update(() => count);
      return resolve();
    }, reject));
  }
  function setupCacheUpdateInterval() {
    activeDonationUpdateInterval = setInterval(() => _rx.Observable.defer(activeDonationsQuery$).subscribe(count => {
      log('activeDonor count: %d', count);
      return activeDonationCountCache.update(() => count);
    }, err => {
      const errMsg = `Error caught updating the cache: ${err.message}`;
      err.message = errMsg;
      (0, _sentryErrorHandler.reportError)(err);
    }), activeDonationCountCacheTTL);
    return null;
  }
}