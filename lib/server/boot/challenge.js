"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildChallengeUrl = buildChallengeUrl;
exports.buildExamUserUpdate = buildExamUserUpdate;
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
var _isNumeric = _interopRequireDefault(require("validator/lib/isNumeric"));
var _isURL = _interopRequireDefault(require("validator/lib/isURL"));
var _nodeFetch = _interopRequireDefault(require("node-fetch"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _secrets = require("../../../config/secrets");
var _challengeTypes = require("../../../shared/config/challenge-types");
var _utils = require("../../common/utils");
var _getCurriculum = require("../utils/get-curriculum");
var _middleware = require("../utils/middleware");
var _redirection = require("../utils/redirection");
var _exam = require("../utils/exam");
var _examSchemas = require("../utils/exam-schemas");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); } /**
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
  const generateExam = createGenerateExam(app);
  api.get('/exam/:id', send200toNonUser, generateExam);
  const examChallengeCompleted = createExamChallengeCompleted(app);
  api.post('/exam-challenge-completed', send200toNonUser, examChallengeCompleted);
  api.post('/save-challenge', send200toNonUser, isValidChallengeCompletion, saveChallenge);
  router.get('/challenges/current-challenge', redirectToCurrentChallenge);
  const coderoadChallengeCompleted = createCoderoadChallengeCompleted(app);
  api.post('/coderoad-challenge-completed', coderoadChallengeCompleted);
  const msTrophyChallengeCompleted = createMsTrophyChallengeCompleted(app);
  api.post('/ms-trophy-challenge-completed', send200toNonUser, msTrophyChallengeCompleted);
  app.use(api);
  app.use(router);
  done();
}
const jsCertProjectIds = ['aaa48de84e1ecc7c742e1124', 'a7f4d8f2483413a6ce226cac', '56533eb9ac21ba0edf2244e2', 'aff0395860f5d3034dc0bfc9', 'aa2e6f85cab2ab736c9a9b24'];
const multifileCertProjectIds = (0, _getCurriculum.getChallenges)().filter(challenge => challenge.challengeType === _challengeTypes.challengeTypes.multifileCertProject).map(challenge => challenge.id);
const multifilePythonCertProjectIds = (0, _getCurriculum.getChallenges)().filter(challenge => challenge.challengeType === _challengeTypes.challengeTypes.multifilePythonCertProject).map(challenge => challenge.id);
const savableChallenges = (0, _getCurriculum.getChallenges)().filter(challenge => {
  return challenge.challengeType === _challengeTypes.challengeTypes.multifileCertProject || challenge.challengeType === _challengeTypes.challengeTypes.multifilePythonCertProject;
}).map(challenge => challenge.id);
const msTrophyChallenges = (0, _getCurriculum.getChallenges)().filter(challenge => challenge.challengeType === _challengeTypes.challengeTypes.msTrophy).map(({
  id,
  msTrophyId
}) => ({
  id,
  msTrophyId
}));
function buildUserUpdate(user, challengeId, _completedChallenge, timezone) {
  const {
    files,
    completedDate = Date.now()
  } = _completedChallenge;
  let completedChallenge = {};
  if (jsCertProjectIds.includes(challengeId) || multifileCertProjectIds.includes(challengeId) || multifilePythonCertProjectIds.includes(challengeId)) {
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
function buildExamUserUpdate(user, _completedChallenge) {
  const {
    id,
    challengeType,
    completedDate = Date.now(),
    examResults
  } = _completedChallenge;
  let finalChallenge = {
    id,
    challengeType,
    completedDate,
    examResults
  };
  const {
    completedChallenges = []
  } = user;
  const $push = {},
    $set = {};

  // Always push to completedExams[] to keep a record of all submissions, it may come in handy.
  $push.completedExams = (0, _utils.fixCompletedExamItem)(_completedChallenge);
  let alreadyCompleted = false;
  let addPoint = false;

  // completedChallenges[] should have their best exam
  if (examResults.passed) {
    const alreadyCompletedIndex = completedChallenges.findIndex(challenge => challenge.id === id);
    alreadyCompleted = alreadyCompletedIndex !== -1;
    if (alreadyCompleted) {
      const {
        percentCorrect
      } = examResults;
      const oldChallenge = completedChallenges[alreadyCompletedIndex];
      const oldResults = oldChallenge.examResults;

      // only update if it's a better result
      if (percentCorrect > oldResults.percentCorrect) {
        finalChallenge.completedDate = oldChallenge.completedDate;
        $set[`completedChallenges.${alreadyCompletedIndex}`] = finalChallenge;
      }
    } else {
      addPoint = true;
      $push.completedChallenges = finalChallenge;
    }
  }
  const updateData = {};
  if (!(0, _lodash.isEmpty)($set)) updateData.$set = $set;
  if (!(0, _lodash.isEmpty)($push)) updateData.$push = $push;
  return {
    alreadyCompleted,
    addPoint,
    updateData,
    completedDate: finalChallenge.completedDate
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
      solution,
      githubLink
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
  // If `backEndProject`:
  // - `solution` needs to exist, but does not have to be valid URL
  // - `githubLink` needs to exist and be valid URL
  if (challengeType === _challengeTypes.challengeTypes.backEndProject) {
    if (!solution || !(0, _isURL.default)(githubLink + '')) {
      log('isObjectId', id, _mongodb.ObjectID.isValid(id));
      return res.status(403).json(isValidChallengeCompletionErrorMsg);
    }
  } else if ('solution' in req.body && !(0, _isURL.default)(solution)) {
    log('isObjectId', id, _mongodb.ObjectID.isValid(id));
    return res.status(403).json(isValidChallengeCompletionErrorMsg);
  }
  return next();
}
async function modernChallengeCompleted(req, res, next) {
  const user = req.user;
  try {
    // This is an ugly way to update `user.completedChallenges`
    await user.getCompletedChallenges$().toPromise();
  } catch (e) {
    return next(e);
  }
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
  if (jsCertProjectIds.includes(id) || multifileCertProjectIds.includes(id) || multifilePythonCertProjectIds.includes(id)) {
    completedChallenge.challengeType = challengeType;
  }
  const {
    alreadyCompleted,
    savedChallenges,
    updateData
  } = buildUserUpdate(user, id, completedChallenge);
  const points = alreadyCompleted ? user.points : user.points + 1;
  user.updateAttributes(updateData, err => {
    if (err) {
      return next(err);
    }
    return res.json({
      points,
      alreadyCompleted,
      completedDate,
      savedChallenges
    });
  });
}
async function projectCompleted(req, res, next) {
  const {
    user,
    body = {}
  } = req;
  const completedChallenge = (0, _lodash.pick)(body, ['id', 'solution', 'githubLink', 'challengeType', 'files']);
  completedChallenge.completedDate = Date.now();
  if (!completedChallenge.solution || completedChallenge.challengeType === _challengeTypes.challengeTypes.backEndProject && !completedChallenge.githubLink) {
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
  try {
    // This is an ugly hack to update `user.completedChallenges`
    await user.getCompletedChallenges$().toPromise();
  } catch (e) {
    return next(e);
  }
  const {
    alreadyCompleted,
    updateData
  } = buildUserUpdate(user, completedChallenge.id, completedChallenge);
  user.updateAttributes(updateData, err => {
    if (err) {
      return next(err);
    }
    return res.json({
      alreadyCompleted,
      points: alreadyCompleted ? user.points : user.points + 1,
      completedDate: completedChallenge.completedDate
    });
  });
}
async function backendChallengeCompleted(req, res, next) {
  const {
    user,
    body = {}
  } = req;
  const completedChallenge = (0, _lodash.pick)(body, ['id', 'solution']);
  completedChallenge.completedDate = Date.now();
  try {
    await user.getCompletedChallenges$().toPromise();
  } catch (e) {
    return next(e);
  }
  const {
    alreadyCompleted,
    updateData
  } = buildUserUpdate(user, completedChallenge.id, completedChallenge);
  user.updateAttributes(updateData, err => {
    if (err) {
      return next(err);
    }
    return res.json({
      alreadyCompleted,
      points: alreadyCompleted ? user.points : user.points + 1,
      completedDate: completedChallenge.completedDate
    });
  });
}

// TODO: send flash message keys to client so they can be i18n
function createGenerateExam(app) {
  const {
    Exam
  } = app.models;
  return async function generateExam(req, res, next) {
    const {
      user,
      params: {
        id
      }
    } = req;
    try {
      await user.getCompletedChallenges$().toPromise();
    } catch (e) {
      return next(e);
    }
    try {
      const examFromDb = await Exam.findById(id);
      if (!examFromDb) {
        res.status(500);
        throw new Error(`An error occurred trying to get the exam from the database.`);
      }

      // This is cause there was struggles validating the exam directly from the db/loopback
      const examJson = JSON.parse(JSON.stringify(examFromDb));
      const validExamFromDbSchema = (0, _examSchemas.validateExamFromDbSchema)(examJson);
      if (validExamFromDbSchema.error) {
        res.status(500);
        log(validExamFromDbSchema.error);
        throw new Error(`An error occurred validating the exam information from the database.`);
      }
      const {
        prerequisites,
        numberOfQuestionsInExam,
        title
      } = examJson;

      // Validate User has completed prerequisite challenges
      prerequisites === null || prerequisites === void 0 ? void 0 : prerequisites.forEach(prerequisite => {
        const prerequisiteCompleted = user.completedChallenges.find(challenge => challenge.id === prerequisite.id);
        if (!prerequisiteCompleted) {
          res.status(403);
          throw new Error(`You have not completed the required challenges to start the '${title}'.`);
        }
      });
      const randomizedExam = (0, _exam.generateRandomExam)(examJson);
      const validGeneratedExamSchema = (0, _examSchemas.validateGeneratedExamSchema)(randomizedExam, numberOfQuestionsInExam);
      if (validGeneratedExamSchema.error) {
        res.status(500);
        log(validGeneratedExamSchema.error);
        throw new Error(`An error occurred trying to randomize the exam.`);
      }
      return res.send({
        generatedExam: randomizedExam
      });
    } catch (err) {
      log(err);
      return res.send({
        error: err.message
      });
    }
  };
}
function createExamChallengeCompleted(app) {
  const {
    Exam
  } = app.models;
  return async function examChallengeCompleted(req, res, next) {
    const {
      body = {},
      user
    } = req;
    try {
      await user.getCompletedChallenges$().toPromise();
    } catch (e) {
      return next(e);
    }
    const {
      userCompletedExam = [],
      id
    } = body;
    try {
      const examFromDb = await Exam.findById(id);
      if (!examFromDb) {
        res.status(500);
        throw new Error(`An error occurred tryng to get the exam from the database.`);
      }

      // This is cause there was struggles validating the exam directly from the db/loopback
      const examJson = JSON.parse(JSON.stringify(examFromDb));
      const validExamFromDbSchema = (0, _examSchemas.validateExamFromDbSchema)(examJson);
      if (validExamFromDbSchema.error) {
        res.status(500);
        log(validExamFromDbSchema.error);
        throw new Error(`An error occurred validating the exam information from the database.`);
      }
      const {
        prerequisites,
        numberOfQuestionsInExam,
        title
      } = examJson;

      // Validate User has completed prerequisite challenges
      prerequisites === null || prerequisites === void 0 ? void 0 : prerequisites.forEach(prerequisite => {
        const prerequisiteCompleted = user.completedChallenges.find(challenge => challenge.id === prerequisite.id);
        if (!prerequisiteCompleted) {
          res.status(403);
          throw new Error(`You have not completed the required challenges to start the '${title}'.`);
        }
      });

      // Validate user completed exam
      const validUserCompletedExam = (0, _examSchemas.validateUserCompletedExamSchema)(userCompletedExam, numberOfQuestionsInExam);
      if (validUserCompletedExam.error) {
        res.status(400);
        log(validUserCompletedExam.error);
        throw new Error(`An error occurred validating the submitted exam.`);
      }
      const examResults = (0, _exam.createExamResults)(userCompletedExam, examJson);
      const validExamResults = (0, _examSchemas.validateExamResultsSchema)(examResults);
      if (validExamResults.error) {
        res.status(500);
        log(validExamResults.error);
        throw new Error(`An error occurred validating the submitted exam.`);
      }
      const completedChallenge = (0, _lodash.pick)(body, ['id', 'challengeType']);
      completedChallenge.completedDate = Date.now();
      completedChallenge.examResults = examResults;
      const {
        addPoint,
        alreadyCompleted,
        updateData,
        completedDate
      } = buildExamUserUpdate(user, completedChallenge);
      user.updateAttributes(updateData, err => {
        if (err) {
          return next(err);
        }
        const points = addPoint ? user.points + 1 : user.points;
        return res.json({
          alreadyCompleted,
          points,
          completedDate,
          examResults
        });
      });
    } catch (err) {
      log(err);
      return res.send({
        error: err.message
      });
    }
  };
}
function createMsTrophyChallengeCompleted(app) {
  const {
    MsUsername
  } = app.models;
  return async function msTrophyChallengeCompleted(req, res, next) {
    const {
      user,
      body = {}
    } = req;
    const {
      id = ''
    } = body;
    try {
      var _msUserAchievementsJs, _msUserAchievementsJs2;
      const msUser = await MsUsername.findOne({
        where: {
          userId: user.id
        }
      });
      if (!msUser || !msUser.msUsername) {
        return res.status(403).json({
          type: 'error',
          message: 'flash.ms.trophy.err-1'
        });
      }
      const {
        msUsername
      } = msUser;
      const challenge = msTrophyChallenges.find(challenge => challenge.id === id);
      if (!challenge) {
        return res.status(400).json({
          type: 'error',
          message: 'flash.ms.trophy.err-2'
        });
      }
      const {
        msTrophyId = ''
      } = challenge;
      const msProfileApi = `https://learn.microsoft.com/api/profiles/${msUsername}`;
      const msProfileApiRes = await (0, _nodeFetch.default)(msProfileApi);
      const msProfileJson = await msProfileApiRes.json();
      if (!msProfileApiRes.ok || !msProfileJson.userId) {
        return res.status(403).json({
          type: 'error',
          message: 'flash.ms.profile.err',
          variables: {
            msUsername
          }
        });
      }
      const {
        userId
      } = msProfileJson;
      const msUserAchievementsApi = `https://learn.microsoft.com/api/achievements/user/${userId}`;
      const msUserAchievementsApiRes = await (0, _nodeFetch.default)(msUserAchievementsApi);
      const msUserAchievementsJson = await msUserAchievementsApiRes.json();
      if (!msUserAchievementsApiRes.ok) {
        return res.status(403).json({
          type: 'error',
          message: 'flash.ms.trophy.err-3'
        });
      }
      if (((_msUserAchievementsJs = msUserAchievementsJson.achievements) === null || _msUserAchievementsJs === void 0 ? void 0 : _msUserAchievementsJs.length) === 0) {
        return res.status(403).json({
          type: 'error',
          message: 'flash.ms.trophy.err-6'
        });
      }
      const hasEarnedTrophy = (_msUserAchievementsJs2 = msUserAchievementsJson.achievements) === null || _msUserAchievementsJs2 === void 0 ? void 0 : _msUserAchievementsJs2.some(a => a.typeId === msTrophyId);
      if (!hasEarnedTrophy) {
        return res.status(403).json({
          type: 'error',
          message: 'flash.ms.trophy.err-4',
          variables: {
            msUsername
          }
        });
      }
      const completedChallenge = (0, _lodash.pick)(body, ['id']);
      completedChallenge.solution = msUserAchievementsApi;
      completedChallenge.completedDate = Date.now();
      try {
        await user.getCompletedChallenges$().toPromise();
      } catch (e) {
        return next(e);
      }
      const {
        alreadyCompleted,
        updateData
      } = buildUserUpdate(user, completedChallenge.id, completedChallenge);
      user.updateAttributes(updateData, err => {
        if (err) {
          return next(err);
        }
        return res.json({
          alreadyCompleted,
          points: alreadyCompleted ? user.points : user.points + 1,
          completedDate: completedChallenge.completedDate
        });
      });
    } catch (e) {
      log(e);
      return res.status(500).json({
        type: 'error',
        message: 'flash.ms.trophy.err-5'
      });
    }
  };
}
async function saveChallenge(req, res, next) {
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
  try {
    await user.getSavedChallenges$().toPromise();
  } catch (e) {
    return next(e);
  }
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
  user.updateAttributes(updateData, err => {
    if (err) {
      return next(err);
    }
    return res.json({
      savedChallenges
    });
  });
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
    if (tutorialOrg !== 'freeCodeCamp') return res.send('Tutorial not hosted on freeCodeCamp GitHub account');

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