"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeUserIdent;
exports.ensureLowerCaseEmail = ensureLowerCaseEmail;
var _dedent = _interopRequireDefault(require("dedent"));
var _rx = require("rx");
var _validator = require("validator");
var _createHandledError = require("../../server/utils/create-handled-error.js");
var _rx2 = require("../../server/utils/rx");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// import debug from 'debug';

// const log = debug('fcc:models:userIdent');

function ensureLowerCaseEmail(profile) {
  var _profile$emails, _profile$emails$;
  return typeof (profile === null || profile === void 0 ? void 0 : (_profile$emails = profile.emails) === null || _profile$emails === void 0 ? void 0 : (_profile$emails$ = _profile$emails[0]) === null || _profile$emails$ === void 0 ? void 0 : _profile$emails$.value) === 'string' ? profile.emails[0].value.toLowerCase() : '';
}
function initializeUserIdent(UserIdent) {
  UserIdent.on('dataSourceAttached', () => {
    UserIdent.findOne$ = (0, _rx2.observeMethod)(UserIdent, 'findOne');
  });
  UserIdent.login = function (_provider, authScheme, profile, credentials, options, cb) {
    const User = UserIdent.app.models.User;
    const AccessToken = UserIdent.app.models.AccessToken;
    options = options || {};
    if (typeof options === 'function' && !cb) {
      cb = options;
      options = {};
    }

    // get the social provider data and the external id from auth0
    profile.id = profile.id || profile.openid;
    const auth0IdString = '' + profile.id;
    const [provider, socialExtId] = auth0IdString.split('|');
    const query = {
      where: {
        provider: provider,
        externalId: socialExtId
      },
      include: 'user'
    };
    // get the email from the auth0 (its expected from social providers)
    const email = ensureLowerCaseEmail(profile);
    if (!(0, _validator.isEmail)('' + email)) {
      throw (0, _createHandledError.wrapHandledError)(new Error('invalid or empty email received from auth0'), {
        message: (0, _dedent.default)`
    ${provider} did not return a valid email address.
    Please try again with a different account that has an
    email associated with it your update your settings on ${provider}, for us to be able to retrieve your email.
          `,
        type: 'info',
        redirectTo: '/'
      });
    }
    if (provider === 'email') {
      return User.findOne$({
        where: {
          email
        }
      }).flatMap(user => {
        return user ? _rx.Observable.of(user) : User.create$({
          email
        }).toPromise();
      }).flatMap(user => {
        if (!user) {
          throw (0, _createHandledError.wrapHandledError)(new Error('could not find or create a user'), {
            message: (0, _dedent.default)`
    We could not find or create a user with that email address.
                `,
            type: 'info',
            redirectTo: '/'
          });
        }
        const createToken = (0, _rx2.observeQuery)(AccessToken, 'create', {
          userId: user.id,
          created: new Date(),
          ttl: user.constructor.settings.ttl
        });
        const updateUserPromise = new Promise((resolve, reject) => user.updateAttributes({
          emailVerified: true,
          emailAuthLinkTTL: null,
          emailVerifyTTL: null
        }, err => {
          if (err) {
            return reject(err);
          }
          return resolve();
        }));
        return _rx.Observable.combineLatest(_rx.Observable.of(user), createToken, _rx.Observable.fromPromise(updateUserPromise), (user, token) => ({
          user,
          token
        }));
      }).subscribe(({
        user,
        token
      }) => cb(null, user, null, token), cb);
    } else {
      return UserIdent.findOne$(query).flatMap(identity => {
        return identity ? _rx.Observable.of(identity.user()) : User.findOne$({
          where: {
            email
          }
        }).flatMap(user => {
          return user ? _rx.Observable.of(user) : User.create$({
            email
          }).toPromise();
        });
      }).flatMap(user => {
        const createToken = (0, _rx2.observeQuery)(AccessToken, 'create', {
          userId: user.id,
          created: new Date(),
          ttl: user.constructor.settings.ttl
        });
        const updateUser = new Promise((resolve, reject) => user.updateAttributes({
          email: email,
          emailVerified: true,
          emailAuthLinkTTL: null,
          emailVerifyTTL: null
        }, err => {
          if (err) {
            return reject(err);
          }
          return resolve();
        }));
        return _rx.Observable.combineLatest(_rx.Observable.of(user), createToken, _rx.Observable.fromPromise(updateUser), (user, token) => ({
          user,
          token
        }));
      }).subscribe(({
        user,
        token
      }) => cb(null, user, null, token), cb);
    }
  };
}