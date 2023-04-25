"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeUser;
exports.ensureLowerCaseString = ensureLowerCaseString;
var _badWords = _interopRequireDefault(require("bad-words"));
var _debug = _interopRequireDefault(require("debug"));
var _dedent = _interopRequireDefault(require("dedent"));
var _lodash = _interopRequireDefault(require("lodash"));
var _moment = _interopRequireDefault(require("moment"));
var _nanoid = require("nanoid");
var _rx = require("rx");
var _v = _interopRequireDefault(require("uuid/v4"));
var _validator = require("validator");
var _constants = require("../../../../config/constants");
var _env = require("../../../../config/env.json");
var _createHandledError = require("../../server/utils/create-handled-error.js");
var _getSetAccessToken = require("../../server/utils/getSetAccessToken");
var _publicUserProps = require("../../server/utils/publicUserProps");
var _rx2 = require("../../server/utils/rx.js");
var _urlUtils = require("../../server/utils/url-utils");
var _utils = require("../utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const log = (0, _debug.default)('fcc:models:user');
const BROWNIEPOINTS_TIMEOUT = [1, 'hour'];
const nanoidCharSet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nanoid = (0, _nanoid.customAlphabet)(nanoidCharSet, 21);
const createEmailError = redirectTo => (0, _createHandledError.wrapHandledError)(new Error('email format is invalid'), {
  type: 'info',
  message: 'Please check to make sure the email is a valid email address.',
  redirectTo
});
function destroyAll(id, Model) {
  return _rx.Observable.fromNodeCallback(Model.destroyAll, Model)({
    userId: id
  });
}
function ensureLowerCaseString(maybeString) {
  return maybeString && maybeString.toLowerCase() || '';
}
function buildCompletedChallengesUpdate(completedChallenges, project) {
  const key = Object.keys(project)[0];
  const solutions = project[key];
  const solutionKeys = Object.keys(solutions);
  const currentCompletedChallenges = [...completedChallenges.map(_utils.fixCompletedChallengeItem)];
  const currentCompletedProjects = currentCompletedChallenges.filter(({
    id
  }) => solutionKeys.includes(id));
  const now = Date.now();
  const update = solutionKeys.reduce((update, currentId) => {
    const indexOfCurrentId = _lodash.default.findIndex(update, ({
      id
    }) => id === currentId);
    const isCurrentlyCompleted = indexOfCurrentId !== -1;
    if (isCurrentlyCompleted) {
      update[indexOfCurrentId] = _objectSpread(_objectSpread({}, _lodash.default.find(update, ({
        id
      }) => id === currentId)), {}, {
        solution: solutions[currentId]
      });
    }
    if (!isCurrentlyCompleted) {
      return [...update, {
        id: currentId,
        solution: solutions[currentId],
        challengeType: 3,
        completedDate: now
      }];
    }
    return update;
  }, currentCompletedProjects);
  const updatedExisting = _lodash.default.uniqBy([...update, ...currentCompletedChallenges], 'id');
  return {
    updated: updatedExisting,
    isNewCompletionCount: updatedExisting.length - completedChallenges.length
  };
}
function isTheSame(val1, val2) {
  return val1 === val2;
}
function getAboutProfile({
  username,
  usernameDisplay,
  githubProfile: github,
  progressTimestamps = [],
  bio
}) {
  return {
    username: usernameDisplay || username,
    github,
    browniePoints: progressTimestamps.length,
    bio
  };
}
function nextTick(fn) {
  return process.nextTick(fn);
}
const getRandomNumber = () => Math.random();
function populateRequiredFields(user) {
  user.usernameDisplay = user.username.trim();
  user.username = user.usernameDisplay.toLowerCase();
  user.email = typeof user.email === 'string' ? user.email.trim().toLowerCase() : user.email;
  if (!user.progressTimestamps) {
    user.progressTimestamps = [];
  }
  if (user.progressTimestamps.length === 0) {
    user.progressTimestamps.push(Date.now());
  }
  if (!user.externalId) {
    user.externalId = (0, _v.default)();
  }
  if (!user.unsubscribeId) {
    user.unsubscribeId = nanoid();
  }
  return;
}
function initializeUser(User) {
  // set salt factor for passwords
  User.settings.saltWorkFactor = 5;
  // set user.rand to random number
  User.definition.rawProperties.rand.default = getRandomNumber;
  User.definition.properties.rand.default = getRandomNumber;
  // increase user accessToken ttl to 900 days
  User.settings.ttl = 900 * 24 * 60 * 60 * 1000;

  // username should not be in blocklist
  User.validatesExclusionOf('username', {
    in: _constants.blocklistedUsernames,
    message: 'is not available'
  });

  // username should be unique
  User.validatesUniquenessOf('username');
  User.settings.emailVerificationRequired = false;
  User.on('dataSourceAttached', () => {
    User.findOne$ = _rx.Observable.fromNodeCallback(User.findOne, User);
    User.count$ = _rx.Observable.fromNodeCallback(User.count, User);
    User.create$ = _rx.Observable.fromNodeCallback(User.create.bind(User));
    User.prototype.createAccessToken$ = _rx.Observable.fromNodeCallback(User.prototype.createAccessToken);
  });
  User.observe('before save', function (ctx) {
    const beforeCreate = _rx.Observable.of(ctx).filter(({
      isNewInstance
    }) => isNewInstance)
    // User.create
    .map(({
      instance
    }) => instance).flatMap(user => {
      // note(berks): we now require all new users to supply an email
      // this was not always the case
      if (typeof user.email !== 'string' || !(0, _validator.isEmail)(user.email)) {
        throw createEmailError();
      }
      // assign random username to new users
      user.username = 'fcc' + (0, _v.default)();
      populateRequiredFields(user);
      return _rx.Observable.fromPromise(User.doesExist(null, user.email)).do(exists => {
        if (exists) {
          throw (0, _createHandledError.wrapHandledError)(new Error('user already exists'), {
            redirectTo: `${_env.apiLocation}/signin`,
            message: (0, _dedent.default)`
        The ${user.email} email address is already associated with an account.
        Try signing in with it here instead.
                  `
          });
        }
      });
    }).ignoreElements();
    const updateOrSave = _rx.Observable.of(ctx)
    // not new
    .filter(({
      isNewInstance
    }) => !isNewInstance).map(({
      instance
    }) => instance)
    // is update or save user
    .filter(Boolean).do(user => {
      // Some old accounts will not have emails associated with them
      // we verify only if the email field is populated
      if (user.email && !(0, _validator.isEmail)(user.email)) {
        throw createEmailError();
      }
      populateRequiredFields(user);
    }).ignoreElements();
    return _rx.Observable.merge(beforeCreate, updateOrSave).toPromise();
  });

  // remove lingering user identities before deleting user
  User.observe('before delete', function (ctx, next) {
    const UserIdentity = User.app.models.UserIdentity;
    const UserCredential = User.app.models.UserCredential;
    log('removing user', ctx.where);
    var id = ctx.where && ctx.where.id ? ctx.where.id : null;
    if (!id) {
      return next();
    }
    return _rx.Observable.combineLatest(destroyAll(id, UserIdentity), destroyAll(id, UserCredential), function (identData, credData) {
      return {
        identData: identData,
        credData: credData
      };
    }).subscribe(function (data) {
      log('deleted', data);
    }, function (err) {
      log('error deleting user %s stuff', id, err);
      next(err);
    }, function () {
      log('user stuff deleted for user %s', id);
      next();
    });
  });
  log('setting up user hooks');
  // overwrite lb confirm
  User.confirm = function (uid, token, redirectTo) {
    return this.findById(uid).then(user => {
      if (!user) {
        throw (0, _createHandledError.wrapHandledError)(new Error(`User not found: ${uid}`), {
          // standard oops
          type: 'info',
          redirectTo
        });
      }
      if (user.verificationToken !== token) {
        throw (0, _createHandledError.wrapHandledError)(new Error(`Invalid token: ${token}`), {
          type: 'info',
          message: (0, _dedent.default)`
                Looks like you have clicked an invalid link.
                Please sign in and request a fresh one.
              `,
          redirectTo
        });
      }
      return new Promise((resolve, reject) => user.updateAttributes({
        email: user.newEmail,
        emailVerified: true,
        emailVerifyTTL: null,
        newEmail: null,
        verificationToken: null
      }, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }));
    });
  };
  User.prototype.loginByRequest = function loginByRequest(req, res) {
    const {
      query: {
        emailChange
      }
    } = req;
    const createToken = this.createAccessToken$().do(accessToken => {
      if (accessToken && accessToken.id) {
        (0, _getSetAccessToken.setAccessTokenToResponse)({
          accessToken
        }, req, res);
      }
    });
    let data = {
      emailVerified: true,
      emailAuthLinkTTL: null,
      emailVerifyTTL: null
    };
    if (emailChange && this.newEmail) {
      data = _objectSpread(_objectSpread({}, data), {}, {
        email: this.newEmail,
        newEmail: null
      });
    }
    const updateUser = new Promise((resolve, reject) => this.updateAttributes(data, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.combineLatest(createToken, _rx.Observable.fromPromise(updateUser), req.logIn(this), accessToken => accessToken);
  };
  User.afterRemote('logout', function ({
    req,
    res
  }, result, next) {
    (0, _getSetAccessToken.removeCookies)(req, res);
    next();
  });
  User.doesExist = function doesExist(username, email) {
    if (!username && (!email || !(0, _validator.isEmail)(email))) {
      return Promise.resolve(false);
    }
    log('check if username is available');
    // check to see if username is on blocklist
    const usernameFilter = new _badWords.default();
    if (username && (_constants.blocklistedUsernames.includes(username) || usernameFilter.isProfane(username))) {
      return Promise.resolve(true);
    }
    var where = {};
    if (username) {
      where.username = username.toLowerCase();
    } else {
      where.email = email ? email.toLowerCase() : email;
    }
    log('where', where);
    return User.count(where).then(count => count > 0);
  };
  User.remoteMethod('doesExist', {
    description: 'checks whether a user exists using email or username',
    accepts: [{
      arg: 'username',
      type: 'string'
    }, {
      arg: 'email',
      type: 'string'
    }],
    returns: [{
      arg: 'exists',
      type: 'boolean'
    }],
    http: {
      path: '/exists',
      verb: 'get'
    }
  });
  User.about = function about(username, cb) {
    if (!username) {
      // Zalgo!!
      return nextTick(() => {
        cb(null, {});
      });
    }
    return User.findOne({
      where: {
        username
      }
    }, (err, user) => {
      if (err) {
        return cb(err);
      }
      if (!user || user.username !== username) {
        return cb(null, {});
      }
      const aboutUser = getAboutProfile(user);
      return cb(null, aboutUser);
    });
  };
  User.remoteMethod('about', {
    description: 'get public info about user',
    accepts: [{
      arg: 'username',
      type: 'string'
    }],
    returns: [{
      arg: 'about',
      type: 'object'
    }],
    http: {
      path: '/about',
      verb: 'get'
    }
  });
  User.prototype.createAuthToken = function createAuthToken({
    ttl
  } = {}) {
    return _rx.Observable.fromNodeCallback(this.authTokens.create.bind(this.authTokens))({
      ttl
    });
  };
  User.prototype.createDonation = function createDonation(donation = {}) {
    return _rx.Observable.fromNodeCallback(this.donations.create.bind(this.donations))(donation).do(() => this.updateAttributes({
      isDonating: true,
      donationEmails: [...(this.donationEmails || []), donation.email]
    }));
  };
  function requestCompletedChallenges() {
    return this.getCompletedChallenges$();
  }
  User.prototype.requestCompletedChallenges = requestCompletedChallenges;
  function requestAuthEmail(isSignUp, newEmail) {
    return _rx.Observable.defer(() => {
      const messageOrNull = (0, _utils.getWaitMessage)(this.emailAuthLinkTTL);
      if (messageOrNull) {
        throw (0, _createHandledError.wrapHandledError)(new Error('request is throttled'), {
          type: 'info',
          message: messageOrNull
        });
      }

      // create a temporary access token with ttl for 15 minutes
      return this.createAuthToken({
        ttl: 15 * 60 * 1000
      });
    }).flatMap(token => {
      let renderAuthEmail = _utils.renderSignInEmail;
      let subject = 'Your sign in link for freeCodeCamp.org';
      if (isSignUp) {
        renderAuthEmail = _utils.renderSignUpEmail;
        subject = 'Your sign in link for your new freeCodeCamp.org account';
      }
      if (newEmail) {
        renderAuthEmail = _utils.renderEmailChangeEmail;
        subject = (0, _dedent.default)`
            Please confirm your updated email address for freeCodeCamp.org
          `;
      }
      const {
        id: loginToken,
        created: emailAuthLinkTTL
      } = token;
      const loginEmail = (0, _utils.getEncodedEmail)(newEmail ? newEmail : null);
      const host = _env.apiLocation;
      const mailOptions = {
        type: 'email',
        to: newEmail ? newEmail : this.email,
        from: (0, _urlUtils.getEmailSender)(),
        subject,
        text: renderAuthEmail({
          host,
          loginEmail,
          loginToken,
          emailChange: !!newEmail
        })
      };
      const userUpdate = new Promise((resolve, reject) => this.updateAttributes({
        emailAuthLinkTTL
      }, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }));
      return _rx.Observable.forkJoin(User.email.send$(mailOptions), _rx.Observable.fromPromise(userUpdate));
    }).map(() => 'Check your email and click the link we sent you to confirm' + ' your new email address.');
  }
  User.prototype.requestAuthEmail = requestAuthEmail;
  function requestUpdateEmail(requestedEmail) {
    const newEmail = ensureLowerCaseString(requestedEmail);
    const currentEmail = ensureLowerCaseString(this.email);
    const isOwnEmail = isTheSame(newEmail, currentEmail);
    const isResendUpdateToSameEmail = isTheSame(newEmail, ensureLowerCaseString(this.newEmail));
    const isLinkSentWithinLimit = (0, _utils.getWaitMessage)(this.emailVerifyTTL);
    const isVerifiedEmail = this.emailVerified;
    if (isOwnEmail && isVerifiedEmail) {
      // email is already associated and verified with this account
      throw (0, _createHandledError.wrapHandledError)(new Error('email is already verified'), {
        type: 'info',
        message: `
            ${newEmail} is already associated with this account.
            You can update a new email address instead.`
      });
    }
    if (isResendUpdateToSameEmail && isLinkSentWithinLimit) {
      // trying to update with the same newEmail and
      // confirmation email is still valid
      throw (0, _createHandledError.wrapHandledError)(new Error(), {
        type: 'info',
        message: (0, _dedent.default)`
          We have already sent an email confirmation request to ${newEmail}.
          ${isLinkSentWithinLimit}`
      });
    }
    if (!(0, _validator.isEmail)('' + newEmail)) {
      throw createEmailError();
    }

    // newEmail is not associated with this user, and
    // this attempt to change email is the first or
    // previous attempts have expired
    if (!isOwnEmail || isOwnEmail && !isVerifiedEmail || isResendUpdateToSameEmail && !isLinkSentWithinLimit) {
      const updateConfig = {
        newEmail,
        emailVerified: false,
        emailVerifyTTL: new Date()
      };

      // defer prevents the promise from firing prematurely (before subscribe)
      return _rx.Observable.defer(() => User.doesExist(null, newEmail)).do(exists => {
        if (exists && !isOwnEmail) {
          // newEmail is not associated with this account,
          // but is associated with different account
          throw (0, _createHandledError.wrapHandledError)(new Error('email already in use'), {
            type: 'info',
            message: `${newEmail} is already associated with another account.`
          });
        }
      }).flatMap(() => {
        const updatePromise = new Promise((resolve, reject) => this.updateAttributes(updateConfig, err => {
          if (err) {
            return reject(err);
          }
          return resolve();
        }));
        return _rx.Observable.forkJoin(_rx.Observable.fromPromise(updatePromise), this.requestAuthEmail(false, newEmail), (_, message) => message);
      });
    } else {
      return 'Something unexpected happened while updating your email.';
    }
  }
  User.prototype.requestUpdateEmail = requestUpdateEmail;
  User.prototype.requestUpdateFlags = async function requestUpdateFlags(values) {
    const flagsToCheck = Object.keys(values);
    const valuesToCheck = _lodash.default.pick(_objectSpread({}, this), flagsToCheck);
    const flagsToUpdate = flagsToCheck.filter(flag => !isTheSame(values[flag], valuesToCheck[flag]));
    if (!flagsToUpdate.length) {
      return _rx.Observable.of((0, _dedent.default)`
        No property in
        ${JSON.stringify(flagsToCheck, null, 2)}
        will introduce a change in this user.
        `).map(() => (0, _dedent.default)`Your settings have not been updated.`);
    }
    const userUpdateData = flagsToUpdate.reduce((data, currentFlag) => {
      data[currentFlag] = values[currentFlag];
      return data;
    }, {});
    log(userUpdateData);
    const userUpdate = new Promise((resolve, reject) => this.updateAttributes(userUpdateData, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(userUpdate).map(() => (0, _dedent.default)`
        We have successfully updated your account.
      `);
  };
  User.prototype.updateMyPortfolio = function updateMyPortfolio(portfolioItem, deleteRequest) {
    const currentPortfolio = this.portfolio.slice(0);
    const pIndex = _lodash.default.findIndex(currentPortfolio, p => p.id === portfolioItem.id);
    let updatedPortfolio = [];
    if (deleteRequest) {
      updatedPortfolio = currentPortfolio.filter(p => p.id !== portfolioItem.id);
    } else if (pIndex === -1) {
      updatedPortfolio = currentPortfolio.concat([portfolioItem]);
    } else {
      updatedPortfolio = [...currentPortfolio];
      updatedPortfolio[pIndex] = _objectSpread({}, portfolioItem);
    }
    const userUpdate = new Promise((resolve, reject) => this.updateAttribute('portfolio', updatedPortfolio, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(userUpdate).map(() => (0, _dedent.default)`
          Your portfolio has been updated.
        `);
  };
  User.prototype.updateMyProjects = function updateMyProjects(project) {
    const updateData = {
      $set: {}
    };
    return this.getCompletedChallenges$().flatMap(() => {
      const {
        updated,
        isNewCompletionCount
      } = buildCompletedChallengesUpdate(this.completedChallenges, project);
      updateData.$set.completedChallenges = updated;
      if (isNewCompletionCount) {
        let points = [];
        // give points a length of isNewCompletionCount
        points[isNewCompletionCount - 1] = true;
        updateData.$push = {};
        updateData.$push.progressTimestamps = {
          $each: points.map(() => Date.now())
        };
      }
      const updatePromise = new Promise((resolve, reject) => this.updateAttributes(updateData, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }));
      return _rx.Observable.fromPromise(updatePromise);
    }).map(() => (0, _dedent.default)`
        Your projects have been updated.
      `);
  };
  User.prototype.updateMyProfileUI = function updateMyProfileUI(profileUI) {
    const newProfileUI = _objectSpread(_objectSpread({}, this.profileUI), profileUI);
    const profileUIUpdate = new Promise((resolve, reject) => this.updateAttribute('profileUI', newProfileUI, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(profileUIUpdate).map(() => (0, _dedent.default)`
        Your privacy settings have been updated.
      `);
  };
  function prepUserForPublish(user, profileUI) {
    const {
      about,
      calendar,
      completedChallenges,
      isDonating,
      joinDate,
      location,
      name,
      points,
      portfolio,
      streak,
      username,
      yearsTopContributor
    } = user;
    const {
      isLocked = true,
      showAbout = false,
      showCerts = false,
      showDonation = false,
      showHeatMap = false,
      showLocation = false,
      showName = false,
      showPoints = false,
      showPortfolio = false,
      showTimeLine = false
    } = profileUI;
    if (isLocked) {
      return {
        isLocked,
        profileUI,
        username
      };
    }
    return _objectSpread(_objectSpread({}, user), {}, {
      about: showAbout ? about : '',
      calendar: showHeatMap ? calendar : {},
      completedChallenges: function () {
        if (showTimeLine) {
          return showCerts ? completedChallenges : completedChallenges.filter(({
            challengeType
          }) => challengeType !== 7);
        } else {
          return [];
        }
      }(),
      isDonating: showDonation ? isDonating : null,
      joinDate: showAbout ? joinDate : '',
      location: showLocation ? location : '',
      name: showName ? name : '',
      points: showPoints ? points : null,
      portfolio: showPortfolio ? portfolio : [],
      streak: showHeatMap ? streak : {},
      yearsTopContributor: yearsTopContributor
    });
  }
  User.getPublicProfile = function getPublicProfile(username, cb) {
    return User.findOne$({
      where: {
        username
      }
    }).flatMap(user => {
      if (!user) {
        return _rx.Observable.of({});
      }
      const {
        completedChallenges,
        progressTimestamps,
        timezone,
        profileUI
      } = user;
      const allUser = _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, _lodash.default.pick(user, _publicUserProps.publicUserProps)), {}, {
        isGithub: !!user.githubProfile,
        isLinkedIn: !!user.linkedin,
        isTwitter: !!user.twitter,
        isWebsite: !!user.website,
        points: progressTimestamps.length,
        completedChallenges
      }, (0, _publicUserProps.getProgress)(progressTimestamps, timezone)), (0, _publicUserProps.normaliseUserFields)(user)), {}, {
        joinDate: user.id.getTimestamp()
      });
      const publicUser = prepUserForPublish(allUser, profileUI);
      return _rx.Observable.of({
        entities: {
          user: {
            [user.username]: _objectSpread({}, publicUser)
          }
        },
        result: user.username
      });
    }).subscribe(user => cb(null, user), cb);
  };
  User.remoteMethod('getPublicProfile', {
    accepts: {
      arg: 'username',
      type: 'string',
      required: true
    },
    returns: [{
      arg: 'user',
      type: 'object',
      root: true
    }],
    http: {
      path: '/get-public-profile',
      verb: 'GET'
    }
  });
  User.giveBrowniePoints = function giveBrowniePoints(receiver, giver, data = {}, dev = false, cb) {
    const findUser = (0, _rx2.observeMethod)(User, 'findOne');
    if (!receiver) {
      return nextTick(() => {
        cb(new TypeError(`receiver should be a string but got ${receiver}`));
      });
    }
    if (!giver) {
      return nextTick(() => {
        cb(new TypeError(`giver should be a string but got ${giver}`));
      });
    }
    let temp = (0, _moment.default)();
    const browniePoints = temp.subtract.apply(temp, BROWNIEPOINTS_TIMEOUT).valueOf();
    const user$ = findUser({
      where: {
        username: receiver
      }
    });
    return user$.tapOnNext(user => {
      if (!user) {
        throw new Error(`could not find receiver for ${receiver}`);
      }
    }).flatMap(({
      progressTimestamps = []
    }) => {
      return _rx.Observable.from(progressTimestamps);
    })
    // filter out non objects
    .filter(timestamp => !!timestamp || typeof timestamp === 'object')
    // filter out timestamps older than one hour
    .filter(({
      timestamp = 0
    }) => {
      return timestamp >= browniePoints;
    })
    // filter out brownie points given by giver
    .filter(browniePoint => {
      return browniePoint.giver === giver;
    })
    // no results means this is the first brownie point given by giver
    // so return -1 to indicate receiver should receive point
    .first({
      defaultValue: -1
    }).flatMap(browniePointsFromGiver => {
      if (browniePointsFromGiver === -1) {
        return user$.flatMap(user => {
          user.progressTimestamps.push(_objectSpread({
            giver,
            timestamp: Date.now()
          }, data));
          return (0, _rx2.saveUser)(user);
        });
      }
      return _rx.Observable.throw(new Error(`${giver} already gave ${receiver} points`));
    }).subscribe(user => {
      return cb(null, getAboutProfile(user), dev ? {
        giver,
        receiver,
        data
      } : null);
    }, e => cb(e, null, dev ? {
      giver,
      receiver,
      data
    } : null), () => {
      log('brownie points assigned completed');
    });
  };
  User.remoteMethod('giveBrowniePoints', {
    description: 'Give this user brownie points',
    accepts: [{
      arg: 'receiver',
      type: 'string',
      required: true
    }, {
      arg: 'giver',
      type: 'string',
      required: true
    }, {
      arg: 'data',
      type: 'object'
    }, {
      arg: 'debug',
      type: 'boolean'
    }],
    returns: [{
      arg: 'about',
      type: 'object'
    }, {
      arg: 'debug',
      type: 'object'
    }],
    http: {
      path: '/give-brownie-points',
      verb: 'POST'
    }
  });
  User.prototype.getPoints$ = function getPoints$() {
    if (Array.isArray(this.progressTimestamps) && this.progressTimestamps.length) {
      return _rx.Observable.of(this.progressTimestamps);
    }
    const id = this.getId();
    const filter = {
      where: {
        id
      },
      fields: {
        progressTimestamps: true
      }
    };
    return this.constructor.findOne$(filter).map(user => {
      this.progressTimestamps = user.progressTimestamps;
      return user.progressTimestamps;
    });
  };
  User.prototype.getCompletedChallenges$ = function getCompletedChallenges$() {
    if (Array.isArray(this.completedChallenges) && this.completedChallenges.length) {
      return _rx.Observable.of(this.completedChallenges);
    }
    const id = this.getId();
    const filter = {
      where: {
        id
      },
      fields: {
        completedChallenges: true
      }
    };
    return this.constructor.findOne$(filter).map(user => {
      this.completedChallenges = user.completedChallenges;
      return user.completedChallenges;
    });
  };
  User.prototype.getSavedChallenges$ = function getSavedChallenges$() {
    if (Array.isArray(this.savedChallenges) && this.savedChallenges.length) {
      return _rx.Observable.of(this.savedChallenges);
    }
    const id = this.getId();
    const filter = {
      where: {
        id
      },
      fields: {
        savedChallenges: true
      }
    };
    return this.constructor.findOne$(filter).map(user => {
      this.savedChallenges = user.savedChallenges;
      return user.savedChallenges;
    });
  };
  User.prototype.getPartiallyCompletedChallenges$ = function getPartiallyCompletedChallenges$() {
    if (Array.isArray(this.partiallyCompletedChallenges) && this.partiallyCompletedChallenges.length) {
      return _rx.Observable.of(this.partiallyCompletedChallenges);
    }
    const id = this.getId();
    const filter = {
      where: {
        id
      },
      fields: {
        partiallyCompletedChallenges: true
      }
    };
    return this.constructor.findOne$(filter).map(user => {
      this.partiallyCompletedChallenges = user.partiallyCompletedChallenges;
      return user.partiallyCompletedChallenges;
    });
  };
  User.getMessages = messages => Promise.resolve(messages);
  User.remoteMethod('getMessages', {
    http: {
      verb: 'get',
      path: '/get-messages'
    },
    accepts: {
      arg: 'messages',
      type: 'object',
      http: ctx => ctx.req.flash()
    },
    returns: [{
      arg: 'messages',
      type: 'object',
      root: true
    }]
  });
}