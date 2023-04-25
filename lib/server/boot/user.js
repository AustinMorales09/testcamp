"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _debug = _interopRequireDefault(require("debug"));
var _dedent = _interopRequireDefault(require("dedent"));
var _expressValidator = require("express-validator");
var _lodash = require("lodash");
var _rx = require("rx");
var _utils = require("../../common/utils");
var _getSetAccessToken = require("../utils/getSetAccessToken");
var _middleware = require("../utils/middleware");
var _publicUserProps = require("../utils/publicUserProps");
var _redirection = require("../utils/redirection");
var _validators = require("../utils/validators");
var _userToken = require("../middlewares/user-token");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
const log = (0, _debug.default)('fcc:boot:user');
const sendNonUserToHome = (0, _middleware.ifNoUserRedirectHome)();
function bootUser(app) {
  const api = app.loopback.Router();
  const getSessionUser = createReadSessionUser(app);
  const postReportUserProfile = createPostReportUserProfile(app);
  const postDeleteAccount = createPostDeleteAccount(app);
  const postUserToken = createPostUserToken(app);
  const deleteUserToken = (0, _userToken.createDeleteUserToken)(app);
  api.get('/account', sendNonUserToHome, getAccount);
  api.get('/account/unlink/:social', sendNonUserToHome, getUnlinkSocial);
  api.get('/user/get-session-user', getSessionUser);
  api.post('/account/delete', _middleware.ifNoUser401, deleteUserToken, postDeleteAccount);
  api.post('/account/reset-progress', _middleware.ifNoUser401, deleteUserToken, postResetProgress);
  api.post('/user/report-user/', _middleware.ifNoUser401, (0, _expressValidator.body)('reportDescription').customSanitizer(_validators.trimTags), postReportUserProfile);
  api.post('/user/user-token', _middleware.ifNoUser401, postUserToken);
  api.delete('/user/user-token', _middleware.ifNoUser401, deleteUserToken, deleteUserTokenResponse);
  app.use(api);
}
function createPostUserToken(app) {
  const {
    UserToken
  } = app.models;
  return async function postUserToken(req, res) {
    const ttl = 900 * 24 * 60 * 60 * 1000;
    let encodedUserToken;
    try {
      await UserToken.destroyAll({
        userId: req.user.id
      });
      const newUserToken = await UserToken.create({
        ttl,
        userId: req.user.id
      });
      if (!(newUserToken !== null && newUserToken !== void 0 && newUserToken.id)) throw new Error();
      encodedUserToken = (0, _userToken.encodeUserToken)(newUserToken.id);
    } catch (e) {
      return res.status(500).send('Error starting project');
    }
    return res.json({
      userToken: encodedUserToken
    });
  };
}
function deleteUserTokenResponse(req, res) {
  if (!req.userTokenDeleted) {
    return res.status(500).send('Error deleting user token');
  }
  return res.send({
    userToken: null
  });
}
function createReadSessionUser(app) {
  const {
    Donation
  } = app.models;
  return async function getSessionUser(req, res, next) {
    var _userTokenArr$;
    const queryUser = req.user;
    const userTokenArr = await queryUser.userTokens({
      userId: queryUser.id
    });
    const userToken = (_userTokenArr$ = userTokenArr[0]) === null || _userTokenArr$ === void 0 ? void 0 : _userTokenArr$.id;
    let encodedUserToken;

    // only encode if a userToken was found
    if (userToken) {
      encodedUserToken = (0, _userToken.encodeUserToken)(userToken);
    }
    const source = queryUser && _rx.Observable.forkJoin(queryUser.getCompletedChallenges$(), queryUser.getPartiallyCompletedChallenges$(), queryUser.getSavedChallenges$(), queryUser.getPoints$(), Donation.getCurrentActiveDonationCount$(), (completedChallenges, partiallyCompletedChallenges, savedChallenges, progressTimestamps, activeDonations) => ({
      activeDonations,
      completedChallenges,
      partiallyCompletedChallenges,
      progress: (0, _publicUserProps.getProgress)(progressTimestamps, queryUser.timezone),
      savedChallenges
    }));
    _rx.Observable.if(() => !queryUser, _rx.Observable.of({
      user: {},
      result: ''
    }), _rx.Observable.defer(() => source).map(({
      activeDonations,
      completedChallenges,
      partiallyCompletedChallenges,
      progress,
      savedChallenges
    }) => ({
      user: _objectSpread(_objectSpread(_objectSpread({}, queryUser.toJSON()), progress), {}, {
        completedChallenges: completedChallenges.map(_utils.fixCompletedChallengeItem),
        partiallyCompletedChallenges: partiallyCompletedChallenges.map(_utils.fixPartiallyCompletedChallengeItem),
        savedChallenges: savedChallenges.map(_utils.fixSavedChallengeItem)
      }),
      sessionMeta: {
        activeDonations
      }
    })).map(({
      user,
      sessionMeta
    }) => ({
      user: {
        [user.username]: _objectSpread(_objectSpread(_objectSpread({}, (0, _lodash.pick)(user, _publicUserProps.userPropsForSession)), {}, {
          username: user.usernameDisplay || user.username,
          isEmailVerified: !!user.emailVerified,
          isGithub: !!user.githubProfile,
          isLinkedIn: !!user.linkedin,
          isTwitter: !!user.twitter,
          isWebsite: !!user.website
        }, (0, _publicUserProps.normaliseUserFields)(user)), {}, {
          joinDate: user.id.getTimestamp(),
          userToken: encodedUserToken
        })
      },
      sessionMeta,
      result: user.username
    }))).subscribe(user => res.json(user), next);
  };
}
function getAccount(req, res) {
  const {
    username
  } = req.user;
  return res.redirect('/' + username);
}
function getUnlinkSocial(req, res, next) {
  const {
    user
  } = req;
  const {
    username
  } = user;
  const {
    origin
  } = (0, _redirection.getRedirectParams)(req);
  let social = req.params.social;
  if (!social) {
    req.flash('danger', 'No social account found');
    return res.redirect('/' + username);
  }
  social = social.toLowerCase();
  const validSocialAccounts = ['twitter', 'linkedin'];
  if (validSocialAccounts.indexOf(social) === -1) {
    req.flash('danger', 'Invalid social account');
    return res.redirect('/' + username);
  }
  if (!user[social]) {
    req.flash('danger', `No ${social} account associated`);
    return res.redirect('/' + username);
  }
  const query = {
    where: {
      provider: social
    }
  };
  return user.identities(query, function (err, identities) {
    if (err) {
      return next(err);
    }

    // assumed user identity is unique by provider
    let identity = identities.shift();
    if (!identity) {
      req.flash('danger', 'No social account found');
      return res.redirect('/' + username);
    }
    return identity.destroy(function (err) {
      if (err) {
        return next(err);
      }
      const updateData = {
        [social]: null
      };
      return user.updateAttributes(updateData, err => {
        if (err) {
          return next(err);
        }
        log(`${social} has been unlinked successfully`);
        req.flash('info', `You've successfully unlinked your ${social}.`);
        return res.redirectWithFlash(`${origin}/${username}`);
      });
    });
  });
}
function postResetProgress(req, res, next) {
  const {
    user
  } = req;
  return user.updateAttributes({
    progressTimestamps: [Date.now()],
    currentChallengeId: '',
    isRespWebDesignCert: false,
    is2018DataVisCert: false,
    isFrontEndLibsCert: false,
    isJsAlgoDataStructCert: false,
    isApisMicroservicesCert: false,
    isInfosecQaCert: false,
    isQaCertV7: false,
    isInfosecCertV7: false,
    is2018FullStackCert: false,
    isFrontEndCert: false,
    isBackEndCert: false,
    isDataVisCert: false,
    isFullStackCert: false,
    isSciCompPyCertV7: false,
    isDataAnalysisPyCertV7: false,
    isMachineLearningPyCertV7: false,
    isRelationalDatabaseCertV8: false,
    completedChallenges: [],
    savedChallenges: [],
    partiallyCompletedChallenges: [],
    needsModeration: false
  }, function (err) {
    if (err) {
      return next(err);
    }
    return res.status(200).json({});
  });
}
function createPostDeleteAccount(app) {
  const {
    User
  } = app.models;
  return async function postDeleteAccount(req, res, next) {
    return User.destroyById(req.user.id, function (err) {
      if (err) {
        return next(err);
      }
      req.logout();
      (0, _getSetAccessToken.removeCookies)(req, res);
      return res.status(200).json({});
    });
  };
}
function createPostReportUserProfile(app) {
  const {
    Email
  } = app.models;
  return function postReportUserProfile(req, res, next) {
    const {
      user
    } = req;
    const {
      username,
      reportDescription: report
    } = req.body;
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    log(username);
    log(report);
    if (!username || !report || report === '') {
      return res.json({
        type: 'danger',
        message: 'flash.provide-username'
      });
    }
    return Email.send$({
      type: 'email',
      to: 'support@freecodecamp.org',
      cc: user.email,
      from: 'team@freecodecamp.org',
      subject: `Abuse Report : Reporting ${username}'s profile.`,
      text: (0, _dedent.default)(`
        Hello Team,\n
        This is to report the profile of ${username}.\n
        Report Details:\n
        ${report}\n\n
        Reported by:
        Username: ${user.username}
        Name: ${user.name}
        Email: ${user.email}\n
        Thanks and regards,
        ${user.name}
      `)
    }, err => {
      if (err) {
        err.redirectTo = `${origin}/${username}`;
        return next(err);
      }
      return res.json({
        type: 'info',
        message: 'flash.report-sent',
        variables: {
          email: user.email
        }
      });
    });
  };
}
var _default = bootUser;
exports.default = _default;