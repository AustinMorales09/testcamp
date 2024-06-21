"use strict";

var _debug = _interopRequireDefault(require("debug"));
var _rx = require("rx");
var _auth = require("../../server/utils/auth");
var _rx2 = require("../../server/utils/rx");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const log = (0, _debug.default)('fcc:models:UserCredential');
module.exports = function (UserCredential) {
  UserCredential.link = function (userId, _provider, authScheme, profile, credentials, options = {}, cb) {
    if (typeof options === 'function' && !cb) {
      cb = options;
      options = {};
    }
    const User = UserCredential.app.models.User;
    const findCred = (0, _rx2.observeMethod)(UserCredential, 'findOne');
    const createCred = (0, _rx2.observeMethod)(UserCredential, 'create');
    const provider = (0, _auth.getSocialProvider)(_provider);
    const query = {
      where: {
        provider: provider,
        externalId: profile.id
      }
    };

    // find createCred if they exist
    // if not create it
    // if yes, update credentials
    // also if github
    //  update profile
    //  update username
    //  update picture
    log('link query', query);
    return findCred(query).flatMap(_credentials => {
      const modified = new Date();
      const updateUser = new Promise((resolve, reject) => {
        User.find({
          id: userId
        }, (err, user) => {
          if (err) {
            return reject(err);
          }
          return user.updateAttributes((0, _auth.createUserUpdatesFromProfile)(provider, profile), updateErr => {
            if (updateErr) {
              return reject(updateErr);
            }
            return resolve();
          });
        });
      });
      let updateCredentials;
      if (!_credentials) {
        updateCredentials = createCred({
          provider,
          externalId: profile.id,
          authScheme,
          // we no longer want to keep the profile
          // this is information we do not need or use
          profile: null,
          credentials,
          userId,
          created: modified,
          modified
        });
      } else {
        _credentials.credentials = credentials;
        updateCredentials = (0, _rx2.observeQuery)(_credentials, 'updateAttributes', {
          profile: null,
          credentials,
          modified
        });
      }
      return _rx.Observable.combineLatest(_rx.Observable.fromPromise(updateUser), updateCredentials, (_, credentials) => credentials);
    }).subscribe(credentials => cb(null, credentials), cb);
  };
};