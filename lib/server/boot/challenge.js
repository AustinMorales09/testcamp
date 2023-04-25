"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildChallengeUrl = buildChallengeUrl;
exports.buildUserUpdate = buildUserUpdate;
exports.createChallengeUrlResolver = createChallengeUrlResolver;
exports.createRedirectToCurrentChallenge = createRedirectToCurrentChallenge;
exports.default = bootChallenge;
exports.getFirstChallenge = getFirstChallenge;
exports.isValidChallengeCompletion = isValidChallengeCompletion;
exports.modernChallengeCompleted = modernChallengeCompleted;
var _debug = _interopRequireDefault(require("debug"));
var _dedent = _interopRequireDefault(require("dedent"));
var _lodash = require("lodash");
var _mongodb = require("mongodb");
var _rx = require("rx");
var _isNumeric = _interopRequireDefault(require("validator/lib/isNumeric"));
var _isURL = _interopRequireDefault(require("validator/lib/isURL"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _secrets = require("../../../configs/secrets");
var _env = require("../../../configs/env.json");
var _utils = require("../../common/utils");
var _getCurriculum = require("../utils/get-curriculum");
var _middleware = require("../utils/middleware");
var _redirection = require("../utils/redirection");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); } /**
                                                                                                                                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                                                                                                                                           * Any ref to fixCompletedChallengesItem should be removed post
                                                                                                                                                                                                                                                                                                                                                                                           * a db migration to fix all completedChallenges
                                                                                                                                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                                                                                                                                           * NOTE: it's been 4 years, so any active users will have been migrated. We
                                                                                                                                                                                                                                                                                                                                                                                           * should still try to migrate the rest at some point.
                                                                                                                                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                                                                                                                                           */
const log = (0, _debug.default)('fcc:boot:challenges');
async function bootChallenge(app, done) {
  const send200toNonUser = (0, _middleware.ifNoUserSend)(true);
  const api = app.loopback.Router();
  const router = app.loopback.Router();
  const challengeUrlResolver = await createChallengeUrlResolver((0, _getCurriculum.getChallenges)());
  const redirectToCurrentChallenge = createRedirectToCurrentChallenge(challengeUrlResolver, _redirection.normalizeParams, _redirection.getRedirectParams);
  api.post('/modern-challenge-completed', send200toNonUser, isValidChallengeCompletion, modernChallengeCompleted);
  api.post('/project-completed', send200toNonUser, isValidChallengeCompletion, projectCompleted);
  api.post('/backend-challenge-completed', send200toNonUser, isValidChallengeCompletion, backendChallengeCompleted);
  api.post('/save-challenge', send200toNonUser, isValidChallengeCompletion, saveChallenge);
  router.get('/challenges/current-challenge', redirectToCurrentChallenge);
  const coderoadChallengeCompleted = createCoderoadChallengeCompleted(app);
  api.post('/coderoad-challenge-completed', coderoadChallengeCompleted);
  app.use(api);
  app.use(router);
  done();
}
const jsCertProjectIds = ['aaa48de84e1ecc7c742e1124', 'a7f4d8f2483413a6ce226cac', '56533eb9ac21ba0edf2244e2', 'aff0395860f5d3034dc0bfc9', 'aa2e6f85cab2ab736c9a9b24'];
const multifileCertProjectIds = (0, _getCurriculum.getChallenges)().filter(challenge => challenge.challengeType === 14).map(challenge => challenge.id);
const savableChallenges = (0, _getCurriculum.getChallenges)().filter(challenge => challenge.challengeType === 14).map(challenge => challenge.id);
function buildUserUpdate(user, challengeId, _completedChallenge, timezone) {
  const {
    files,
    completedDate = Date.now()
  } = _completedChallenge;
  let completedChallenge = {};
  if (jsCertProjectIds.includes(challengeId) || multifileCertProjectIds.includes(challengeId)) {
    completedChallenge = _objectSpread(_objectSpread({}, _completedChallenge), {}, {
      files: files === null || files === void 0 ? void 0 : files.map(file => (0, _lodash.pick)(file, ['contents', 'key', 'index', 'name', 'path', 'ext']))
    });
  } else {
    completedChallenge = (0, _lodash.omit)(_completedChallenge, ['files']);
  }
  let finalChallenge;
  const $push = {},
    $set = {},
    $pull = {};
  const {
    timezone: userTimezone,
    completedChallenges = [],
    needsModeration = false,
    savedChallenges = []
  } = user;
  const oldIndex = completedChallenges.findIndex(({
    id
  }) => challengeId === id);
  const alreadyCompleted = oldIndex !== -1;
  const oldChallenge = alreadyCompleted ? completedChallenges[oldIndex] : null;
  if (alreadyCompleted) {
    finalChallenge = _objectSpread(_objectSpread({}, completedChallenge), {}, {
      completedDate: oldChallenge.completedDate
    });
    $set[`completedChallenges.${oldIndex}`] = finalChallenge;
  } else {
    finalChallenge = _objectSpread({}, completedChallenge);
    $push.progressTimestamps = completedDate;
    $push.completedChallenges = finalChallenge;
  }
  if (savableChallenges.includes(challengeId)) {
    const challengeToSave = {
      id: challengeId,
      lastSavedDate: completedDate,
      files: files === null || files === void 0 ? void 0 : files.map(file => (0, _lodash.pick)(file, ['contents', 'key', 'name', 'ext', 'history']))
    };
    const savedIndex = savedChallenges.findIndex(({
      id
    }) => challengeId === id);
    if (savedIndex >= 0) {
      $set[`savedChallenges.${savedIndex}`] = challengeToSave;
      savedChallenges[savedIndex] = challengeToSave;
    } else {
      $push.savedChallenges = challengeToSave;
      savedChallenges.push(challengeToSave);
    }
  }

  // remove from partiallyCompleted on submit
  $pull.partiallyCompletedChallenges = {
    id: challengeId
  };
  if (timezone && timezone !== 'UTC' && (!userTimezone || userTimezone === 'UTC')) {
    $set.timezone = userTimezone;
  }
  if (needsModeration) $set.needsModeration = true;
  const updateData = {};
  if (!(0, _lodash.isEmpty)($set)) updateData.$set = $set;
  if (!(0, _lodash.isEmpty)($push)) updateData.$push = $push;
  if (!(0, _lodash.isEmpty)($pull)) updateData.$pull = $pull;
  return {
    alreadyCompleted,
    updateData,
    completedDate: finalChallenge.completedDate,
    savedChallenges
  };
}
function buildChallengeUrl(challenge) {
  const {
    superBlock,
    block,
    dashedName
  } = challenge;
  return `/learn/${superBlock}/${block}/${dashedName}`;
}

// this is only called once during boot, so it can be slow.
function getFirstChallenge(allChallenges) {
  const first = allChallenges.find(({
    challengeOrder,
    superOrder,
    order
  }) => challengeOrder === 0 && superOrder === 0 && order === 0);
  return first ? buildChallengeUrl(first) : '/learn';
}
function getChallengeById(allChallenges, targetId) {
  return allChallenges.find(({
    id
  }) => id === targetId);
}
async function createChallengeUrlResolver(allChallenges, {
  _getFirstChallenge = getFirstChallenge
} = {}) {
  const cache = new Map();
  const firstChallenge = _getFirstChallenge(allChallenges);
  return function resolveChallengeUrl(id) {
    if ((0, _lodash.isEmpty)(id)) {
      return Promise.resolve(firstChallenge);
    } else {
      return new Promise(resolve => {
        if (cache.has(id)) {
          resolve(cache.get(id));
        }
        const challenge = getChallengeById(allChallenges, id);
        if ((0, _lodash.isEmpty)(challenge)) {
          resolve(firstChallenge);
        } else {
          const challengeUrl = buildChallengeUrl(challenge);
          cache.set(id, challengeUrl);
          resolve(challengeUrl);
        }
      });
    }
  };
}
function isValidChallengeCompletion(req, res, next) {
  const {
    body: {
      id,
      challengeType,
      solution
    }
  } = req;

  // ToDO: Validate other things (challengeFiles, etc)
  const isValidChallengeCompletionErrorMsg = {
    type: 'error',
    message: 'That does not appear to be a valid challenge submission.'
  };
  if (!_mongodb.ObjectID.isValid(id)) {
    log('isObjectId', id, _mongodb.ObjectID.isValid(id));
    return res.status(403).json(isValidChallengeCompletionErrorMsg);
  }
  if ('challengeType' in req.body && !(0, _isNumeric.default)(String(challengeType))) {
    log('challengeType', challengeType, (0, _isNumeric.default)(challengeType));
    return res.status(403).json(isValidChallengeCompletionErrorMsg);
  }
  if ('solution' in req.body && !(0, _isURL.default)(solution)) {
    log('isObjectId', id, _mongodb.ObjectID.isValid(id));
    return res.status(403).json(isValidChallengeCompletionErrorMsg);
  }
  return next();
}
function modernChallengeCompleted(req, res, next) {
  const user = req.user;
  return user.getCompletedChallenges$().flatMap(() => {
    const completedDate = Date.now();
    const {
      id,
      files,
      challengeType
    } = req.body;
    const completedChallenge = {
      id,
      files,
      completedDate
    };

    // if multifile cert project
    if (challengeType === 14) {
      completedChallenge.isManuallyApproved = false;
      user.needsModeration = true;
    }

    // We only need to know the challenge type if it's a project. If it's a
    // step or normal challenge we can avoid storing in the database.
    if (jsCertProjectIds.includes(id) || multifileCertProjectIds.includes(id)) {
      completedChallenge.challengeType = challengeType;
    }
    const {
      alreadyCompleted,
      savedChallenges,
      updateData
    } = buildUserUpdate(user, id, completedChallenge);
    const points = alreadyCompleted ? user.points : user.points + 1;
    const updatePromise = new Promise((resolve, reject) => user.updateAttributes(updateData, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(updatePromise).map(() => {
      return res.json({
        points,
        alreadyCompleted,
        completedDate,
        savedChallenges
      });
    });
  }).subscribe(() => {}, next);
}
function projectCompleted(req, res, next) {
  const {
    user,
    body = {}
  } = req;
  const completedChallenge = (0, _lodash.pick)(body, ['id', 'solution', 'githubLink', 'challengeType', 'files']);
  completedChallenge.completedDate = Date.now();
  if (!completedChallenge.solution) {
    return res.status(403).json({
      type: 'error',
      message: 'You have not provided the valid links for us to inspect your work.'
    });
  }

  // CodeRoad cert project
  if (completedChallenge.challengeType === 13) {
    const {
      partiallyCompletedChallenges = [],
      completedChallenges = []
    } = user;
    const isPartiallyCompleted = partiallyCompletedChallenges.some(challenge => challenge.id === completedChallenge.id);
    const isCompleted = completedChallenges.some(challenge => challenge.id === completedChallenge.id);
    if (!isPartiallyCompleted && !isCompleted) {
      return res.status(403).json({
        type: 'error',
        message: 'You have to complete the project before you can submit a URL.'
      });
    }
  }
  return user.getCompletedChallenges$().flatMap(() => {
    const {
      alreadyCompleted,
      updateData
    } = buildUserUpdate(user, completedChallenge.id, completedChallenge);
    const updatePromise = new Promise((resolve, reject) => user.updateAttributes(updateData, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(updatePromise).doOnNext(() => {
      return res.json({
        alreadyCompleted,
        points: alreadyCompleted ? user.points : user.points + 1,
        completedDate: completedChallenge.completedDate
      });
    });
  }).subscribe(() => {}, next);
}
function backendChallengeCompleted(req, res, next) {
  const {
    user,
    body = {}
  } = req;
  const completedChallenge = (0, _lodash.pick)(body, ['id', 'solution']);
  completedChallenge.completedDate = Date.now();
  return user.getCompletedChallenges$().flatMap(() => {
    const {
      alreadyCompleted,
      updateData
    } = buildUserUpdate(user, completedChallenge.id, completedChallenge);
    const updatePromise = new Promise((resolve, reject) => user.updateAttributes(updateData, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(updatePromise).doOnNext(() => {
      return res.json({
        alreadyCompleted,
        points: alreadyCompleted ? user.points : user.points + 1,
        completedDate: completedChallenge.completedDate
      });
    });
  }).subscribe(() => {}, next);
}
function saveChallenge(req, res, next) {
  const user = req.user;
  const {
    savedChallenges = []
  } = user;
  const {
    id: challengeId,
    files = []
  } = req.body;
  if (!savableChallenges.includes(challengeId)) {
    return res.status(403).send('That challenge type is not savable');
  }
  const challengeToSave = {
    id: challengeId,
    lastSavedDate: Date.now(),
    files: files === null || files === void 0 ? void 0 : files.map(file => (0, _lodash.pick)(file, ['contents', 'key', 'name', 'ext', 'history']))
  };
  return user.getSavedChallenges$().flatMap(() => {
    const savedIndex = savedChallenges.findIndex(({
      id
    }) => challengeId === id);
    const $push = {},
      $set = {};
    if (savedIndex >= 0) {
      $set[`savedChallenges.${savedIndex}`] = challengeToSave;
      savedChallenges[savedIndex] = challengeToSave;
    } else {
      $push.savedChallenges = challengeToSave;
      savedChallenges.push(challengeToSave);
    }
    const updateData = {};
    if (!(0, _lodash.isEmpty)($set)) updateData.$set = $set;
    if (!(0, _lodash.isEmpty)($push)) updateData.$push = $push;
    const updatePromise = new Promise((resolve, reject) => user.updateAttributes(updateData, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    }));
    return _rx.Observable.fromPromise(updatePromise).doOnNext(() => {
      return res.json({
        savedChallenges
      });
    });
  }).subscribe(() => {}, next);
}
const codeRoadChallenges = (0, _getCurriculum.getChallenges)().filter(({
  challengeType
}) => challengeType === 12 || challengeType === 13);
function createCoderoadChallengeCompleted(app) {
  /* Example request coming from CodeRoad:
   * req.body: { tutorialId: 'freeCodeCamp/learn-bash-by-building-a-boilerplate:v1.0.0' }
   * req.headers: { coderoad-user-token: '8kFIlZiwMioY6hqqt...' }
   */

  const {
    UserToken,
    User
  } = app.models;
  return async function coderoadChallengeCompleted(req, res) {
    var _tutorialRepo$split;
    const {
      'coderoad-user-token': encodedUserToken
    } = req.headers;
    const {
      tutorialId
    } = req.body;
    if (!tutorialId) return res.send(`'tutorialId' not found in request body`);
    if (!encodedUserToken) return res.send(`'coderoad-user-token' not found in request headers`);
    let userToken;
    try {
      var _jwt$verify;
      userToken = (_jwt$verify = _jsonwebtoken.default.verify(encodedUserToken, _secrets.jwtSecret)) === null || _jwt$verify === void 0 ? void 0 : _jwt$verify.userToken;
    } catch {
      return res.send(`invalid user token`);
    }
    const tutorialRepo = tutorialId === null || tutorialId === void 0 ? void 0 : tutorialId.split(':')[0];
    const tutorialOrg = tutorialRepo === null || tutorialRepo === void 0 ? void 0 : (_tutorialRepo$split = tutorialRepo.split('/')) === null || _tutorialRepo$split === void 0 ? void 0 : _tutorialRepo$split[0];

    // this allows any GH account to host the repo in development or staging
    // .org submissions should always be from repos hosted on the fCC GH org
    if (_env.deploymentEnv !== 'staging' && _env.environment !== 'development') {
      if (tutorialOrg !== 'freeCodeCamp') return res.send('Tutorial not hosted on freeCodeCamp GitHub account');
    }

    // validate tutorial name is in codeRoadChallenges object
    const challenge = codeRoadChallenges.find(challenge => {
      var _challenge$url;
      return (_challenge$url = challenge.url) === null || _challenge$url === void 0 ? void 0 : _challenge$url.endsWith(tutorialRepo);
    });
    if (!challenge) return res.send('Tutorial name is not valid');
    const {
      id: challengeId,
      challengeType
    } = challenge;
    try {
      var _userUpdateInfo;
      // check if user token is in database
      const tokenInfo = await UserToken.findOne({
        where: {
          id: userToken
        }
      });
      if (!tokenInfo) return res.send('User token not found');
      const {
        userId
      } = tokenInfo;

      // check if user exists for user token
      const user = await User.findOne({
        where: {
          id: userId
        }
      });
      if (!user) return res.send('User for user token not found');

      // submit challenge
      const completedDate = Date.now();
      const {
        completedChallenges = [],
        partiallyCompletedChallenges = []
      } = user;
      let userUpdateInfo = {};
      const isCompleted = completedChallenges.some(challenge => challenge.id === challengeId);

      // if CodeRoad cert project and not in completedChallenges,
      // add to partiallyCompletedChallenges
      if (challengeType === 13 && !isCompleted) {
        const finalChallenge = {
          id: challengeId,
          completedDate
        };
        userUpdateInfo.updateData = {};
        userUpdateInfo.updateData.$set = {
          partiallyCompletedChallenges: (0, _lodash.uniqBy)([finalChallenge, ...partiallyCompletedChallenges.map(_utils.fixPartiallyCompletedChallengeItem)], 'id')
        };

        // else, add to or update completedChallenges
      } else {
        userUpdateInfo = buildUserUpdate(user, challengeId, {
          id: challengeId,
          completedDate
        });
      }
      const updatedUser = await user.updateAttributes((_userUpdateInfo = userUpdateInfo) === null || _userUpdateInfo === void 0 ? void 0 : _userUpdateInfo.updateData);
      if (!updatedUser) return res.send('An error occurred trying to submit the challenge');
    } catch (e) {
      return res.send('An error occurred trying to submit the challenge');
    }
    return res.send('Successfully submitted challenge');
  };
}

// TODO: extend tests to cover www.freecodecamp.org/language and
// chinese.freecodecamp.org
function createRedirectToCurrentChallenge(challengeUrlResolver, normalizeParams, getRedirectParams) {
  return async function redirectToCurrentChallenge(req, res, next) {
    const {
      user
    } = req;
    const {
      origin,
      pathPrefix
    } = getRedirectParams(req, normalizeParams);
    const redirectBase = (0, _redirection.getPrefixedLandingPath)(origin, pathPrefix);
    if (!user) {
      return res.redirect(redirectBase + '/learn');
    }
    const challengeId = user && user.currentChallengeId;
    const challengeUrl = await challengeUrlResolver(challengeId).catch(next);
    if (challengeUrl === '/learn') {
      // this should normally not be hit if database is properly seeded
      throw new Error((0, _dedent.default)`
        Attempted to find the url for ${challengeId || 'Unknown ID'}'
        but came up empty.
        db may not be properly seeded.
      `);
    }
    return res.redirect(`${redirectBase}${challengeUrl}`);
  };
}