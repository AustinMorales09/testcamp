"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bootCertificate;
exports.getFallbackFullStackDate = getFallbackFullStackDate;
exports.ifNoCertification404 = ifNoCertification404;
var _path = _interopRequireDefault(require("path"));
var _debug = _interopRequireDefault(require("debug"));
var _dedent = _interopRequireDefault(require("dedent"));
var _lodash = _interopRequireDefault(require("lodash"));
var _loopback = _interopRequireDefault(require("loopback"));
var _rx = require("rx");
var _validator = require("validator");
var _certificationSettings = require("../../../../shared/config/certification-settings");
var _sentryErrorHandler = require("../middlewares/sentry-error-handler.js");
var _disabledEndpoints = require("../utils/disabled-endpoints");
var _getCurriculum = require("../utils/get-curriculum");
var _middleware = require("../utils/middleware");
var _rx2 = require("../utils/rx");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  legacyFrontEndChallengeId,
  legacyBackEndChallengeId,
  legacyDataVisId,
  legacyInfosecQaId,
  legacyFullStackId,
  respWebDesignId,
  frontEndDevLibsId,
  jsAlgoDataStructId,
  dataVis2018Id,
  apisMicroservicesId,
  qaV7Id,
  infosecV7Id,
  sciCompPyV7Id,
  dataAnalysisPyV7Id,
  machineLearningPyV7Id,
  relationalDatabaseV8Id,
  collegeAlgebraPyV8Id,
  foundationalCSharpV8Id,
  jsAlgoDataStructV8Id
} = _certificationSettings.certIds;
const log = (0, _debug.default)('fcc:certification');
function bootCertificate(app) {
  const api = app.loopback.Router();
  // TODO: rather than getting all the challenges, then grabbing the certs,
  // consider just getting the certs.
  const certTypeIds = createCertTypeIds((0, _getCurriculum.getChallenges)());
  const showCert = createShowCert(app);
  const verifyCert = createVerifyCert(certTypeIds, app);
  api.put('/certificate/verify', _middleware.ifNoUser401, ifNoCertification404, verifyCert);
  api.get('/certificate/showCert/:username/:certSlug', showCert);
  api.get('/certificate/verify-can-claim-cert', _disabledEndpoints.deprecatedEndpoint);
  app.use(api);
}
function getFallbackFullStackDate(completedChallenges, completedDate) {
  var _completedChallenges$;
  var chalIds = [respWebDesignId, jsAlgoDataStructId, frontEndDevLibsId, dataVis2018Id, apisMicroservicesId, legacyInfosecQaId];
  const latestCertDate = (_completedChallenges$ = completedChallenges.filter(chal => chalIds.includes(chal.id)).sort((a, b) => b.completedDate - a.completedDate)[0]) === null || _completedChallenges$ === void 0 ? void 0 : _completedChallenges$.completedDate;
  return latestCertDate ? latestCertDate : completedDate;
}
function ifNoCertification404(req, res, next) {
  const {
    certSlug
  } = req.body;
  if (!certSlug) return res.status(404).end();
  if (_certificationSettings.currentCertifications.includes(certSlug) || _certificationSettings.legacyCertifications.includes(certSlug) || _certificationSettings.legacyFullStackCertification.includes(certSlug)) return next();
  if (process.env.SHOW_UPCOMING_CHANGES === 'true' && _certificationSettings.upcomingCertifications.includes(certSlug)) {
    return next();
  }
  res.status(404).end();
}
const renderCertifiedEmail = _loopback.default.template(_path.default.join(__dirname, '..', 'views', 'emails', 'certified.ejs'));
function createCertTypeIds(allChallenges) {
  return {
    // legacy
    [_certificationSettings.certTypes.frontEnd]: getCertById(legacyFrontEndChallengeId, allChallenges),
    [_certificationSettings.certTypes.jsAlgoDataStruct]: getCertById(jsAlgoDataStructId, allChallenges),
    [_certificationSettings.certTypes.backEnd]: getCertById(legacyBackEndChallengeId, allChallenges),
    [_certificationSettings.certTypes.dataVis]: getCertById(legacyDataVisId, allChallenges),
    [_certificationSettings.certTypes.infosecQa]: getCertById(legacyInfosecQaId, allChallenges),
    [_certificationSettings.certTypes.fullStack]: getCertById(legacyFullStackId, allChallenges),
    // modern
    [_certificationSettings.certTypes.respWebDesign]: getCertById(respWebDesignId, allChallenges),
    [_certificationSettings.certTypes.jsAlgoDataStructV8]: getCertById(jsAlgoDataStructV8Id, allChallenges),
    [_certificationSettings.certTypes.frontEndDevLibs]: getCertById(frontEndDevLibsId, allChallenges),
    [_certificationSettings.certTypes.dataVis2018]: getCertById(dataVis2018Id, allChallenges),
    [_certificationSettings.certTypes.apisMicroservices]: getCertById(apisMicroservicesId, allChallenges),
    [_certificationSettings.certTypes.qaV7]: getCertById(qaV7Id, allChallenges),
    [_certificationSettings.certTypes.infosecV7]: getCertById(infosecV7Id, allChallenges),
    [_certificationSettings.certTypes.sciCompPyV7]: getCertById(sciCompPyV7Id, allChallenges),
    [_certificationSettings.certTypes.dataAnalysisPyV7]: getCertById(dataAnalysisPyV7Id, allChallenges),
    [_certificationSettings.certTypes.machineLearningPyV7]: getCertById(machineLearningPyV7Id, allChallenges),
    [_certificationSettings.certTypes.relationalDatabaseV8]: getCertById(relationalDatabaseV8Id, allChallenges),
    [_certificationSettings.certTypes.collegeAlgebraPyV8]: getCertById(collegeAlgebraPyV8Id, allChallenges),
    [_certificationSettings.certTypes.foundationalCSharpV8]: getCertById(foundationalCSharpV8Id, allChallenges)
  };
}
function hasCompletedTests(ids, completedChallenges = []) {
  return _lodash.default.every(ids, ({
    id
  }) => _lodash.default.find(completedChallenges, ({
    id: completedId
  }) => completedId === id));
}
function getCertById(anId, allChallenges) {
  return allChallenges.filter(({
    id
  }) => id === anId).map(({
    id,
    tests,
    name,
    challengeType
  }) => ({
    id,
    tests,
    name,
    challengeType
  }))[0];
}
function sendCertifiedEmail({
  email = '',
  name,
  username,
  isRespWebDesignCert,
  isJsAlgoDataStructCertV8,
  isFrontEndLibsCert,
  isDataVisCert,
  isApisMicroservicesCert,
  isQaCertV7,
  isInfosecCertV7,
  isSciCompPyCertV7,
  isDataAnalysisPyCertV7,
  isMachineLearningPyCertV7,
  isRelationalDatabaseCertV8,
  isCollegeAlgebraPyCertV8,
  isFoundationalCSharpCertV8
}, send$) {
  if (!(0, _validator.isEmail)(email) || !isRespWebDesignCert || !isJsAlgoDataStructCertV8 || !isFrontEndLibsCert || !isDataVisCert || !isApisMicroservicesCert || !isQaCertV7 || !isInfosecCertV7 || !isSciCompPyCertV7 || !isDataAnalysisPyCertV7 || !isMachineLearningPyCertV7 || !isRelationalDatabaseCertV8 || !isCollegeAlgebraPyCertV8 || !isFoundationalCSharpCertV8) {
    return _rx.Observable.just(false);
  }
  const notifyUser = {
    type: 'email',
    to: email,
    from: 'quincy@freecodecamp.org',
    subject: (0, _dedent.default)`
      Congratulations on completing all of the
      freeCodeCamp certifications!
    `,
    text: renderCertifiedEmail({
      username,
      name
    })
  };
  return send$(notifyUser).map(() => true);
}
function getUserIsCertMap(user) {
  const {
    isRespWebDesignCert = false,
    isJsAlgoDataStructCert = false,
    isJsAlgoDataStructCertV8 = false,
    isFrontEndLibsCert = false,
    is2018DataVisCert = false,
    isApisMicroservicesCert = false,
    isInfosecQaCert = false,
    isQaCertV7 = false,
    isInfosecCertV7 = false,
    isFrontEndCert = false,
    isBackEndCert = false,
    isDataVisCert = false,
    isFullStackCert = false,
    isSciCompPyCertV7 = false,
    isDataAnalysisPyCertV7 = false,
    isMachineLearningPyCertV7 = false,
    isRelationalDatabaseCertV8 = false,
    isCollegeAlgebraPyCertV8 = false,
    isFoundationalCSharpCertV8 = false
  } = user;
  return {
    isRespWebDesignCert,
    isJsAlgoDataStructCert,
    isJsAlgoDataStructCertV8,
    isFrontEndLibsCert,
    is2018DataVisCert,
    isApisMicroservicesCert,
    isInfosecQaCert,
    isQaCertV7,
    isInfosecCertV7,
    isFrontEndCert,
    isBackEndCert,
    isDataVisCert,
    isFullStackCert,
    isSciCompPyCertV7,
    isDataAnalysisPyCertV7,
    isMachineLearningPyCertV7,
    isRelationalDatabaseCertV8,
    isCollegeAlgebraPyCertV8,
    isFoundationalCSharpCertV8
  };
}
function createVerifyCert(certTypeIds, app) {
  const {
    Email
  } = app.models;
  return function verifyCert(req, res, next) {
    const {
      body: {
        certSlug
      },
      user
    } = req;
    log(certSlug);
    let certType = _certificationSettings.certSlugTypeMap[certSlug];
    log(certType);
    return _rx.Observable.of(certTypeIds[certType]).flatMap(challenge => {
      const certName = _certificationSettings.certTypeTitleMap[certType];
      if (user[certType]) {
        return _rx.Observable.just({
          type: 'info',
          message: 'flash.already-claimed',
          variables: {
            name: certName
          }
        });
      }

      // certificate doesn't exist or
      // connection error
      if (!challenge) {
        (0, _sentryErrorHandler.reportError)(`Error claiming ${certName}`);
        return _rx.Observable.just({
          type: 'danger',
          message: 'flash.wrong-name',
          variables: {
            name: certName
          }
        });
      }
      const {
        id,
        tests,
        challengeType
      } = challenge;
      if (!hasCompletedTests(tests, user.completedChallenges)) {
        return _rx.Observable.just({
          type: 'info',
          message: 'flash.incomplete-steps',
          variables: {
            name: certName
          }
        });
      }
      const updateData = {
        [certType]: true,
        completedChallenges: [...user.completedChallenges, {
          id,
          completedDate: new Date(),
          challengeType
        }]
      };
      if (!user.name) {
        return _rx.Observable.just({
          type: 'info',
          message: 'flash.name-needed'
        });
      }
      // set here so sendCertifiedEmail works properly
      // not used otherwise
      user[certType] = true;
      const updatePromise = new Promise((resolve, reject) => user.updateAttributes(updateData, err => {
        if (err) {
          return reject(err);
        }
        return resolve();
      }));
      return _rx.Observable.combineLatest(
      // update user data
      _rx.Observable.fromPromise(updatePromise),
      // sends notification email is user has all 6 certs
      // if not it noop
      sendCertifiedEmail(user, Email.send$), (_, pledgeOrMessage) => ({
        pledgeOrMessage
      })).map(({
        pledgeOrMessage
      }) => {
        if (typeof pledgeOrMessage === 'string') {
          log(pledgeOrMessage);
        }
        log('Certificates updated');
        return {
          type: 'success',
          message: 'flash.cert-claim-success',
          variables: {
            username: user.username,
            name: certName
          }
        };
      });
    }).subscribe(message => {
      return res.status(200).json({
        response: message,
        isCertMap: getUserIsCertMap(user),
        // send back the completed challenges
        // NOTE: we could just send back the latest challenge, but this
        // ensures the challenges are synced.
        completedChallenges: user.completedChallenges
      });
    }, next);
  };
}
function createShowCert(app) {
  const {
    User
  } = app.models;
  function findUserByUsername$(username, fields) {
    return (0, _rx2.observeQuery)(User, 'findOne', {
      where: {
        username
      },
      fields
    });
  }
  return function showCert(req, res, next) {
    let {
      username,
      certSlug
    } = req.params;
    username = username.toLowerCase();
    const certType = _certificationSettings.certSlugTypeMap[certSlug];
    const certId = _certificationSettings.certTypeIdMap[certType];
    const certTitle = _certificationSettings.certTypeTitleMap[certType];
    const completionTime = _certificationSettings.completionHours[certType] || 300;
    return findUserByUsername$(username, {
      isBanned: true,
      isCheater: true,
      isFrontEndCert: true,
      isBackEndCert: true,
      isFullStackCert: true,
      isRespWebDesignCert: true,
      isFrontEndLibsCert: true,
      isJsAlgoDataStructCert: true,
      isJsAlgoDataStructCertV8: true,
      isDataVisCert: true,
      is2018DataVisCert: true,
      isApisMicroservicesCert: true,
      isInfosecQaCert: true,
      isQaCertV7: true,
      isInfosecCertV7: true,
      isSciCompPyCertV7: true,
      isDataAnalysisPyCertV7: true,
      isMachineLearningPyCertV7: true,
      isRelationalDatabaseCertV8: true,
      isCollegeAlgebraPyCertV8: true,
      isFoundationalCSharpCertV8: true,
      isHonest: true,
      username: true,
      name: true,
      completedChallenges: true,
      profileUI: true
    }).subscribe(user => {
      if (!user) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.username-not-found',
            variables: {
              username: username
            }
          }]
        });
      }
      const {
        isLocked,
        showCerts,
        showName,
        showTimeLine
      } = user.profileUI;
      if (user.isCheater || user.isBanned) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.not-eligible'
          }]
        });
      }
      if (!user.isHonest) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.not-honest',
            variables: {
              username: username
            }
          }]
        });
      }
      if (isLocked) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.profile-private',
            variables: {
              username: username
            }
          }]
        });
      }

      // If the user does not have a name, and have set their name to public,
      // warn them. Otherwise, fallback to username
      if (!user.name && user.showName) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.add-name'
          }]
        });
      }
      if (!showCerts) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.certs-private',
            variables: {
              username: username
            }
          }]
        });
      }
      if (!showTimeLine) {
        return res.json({
          messages: [{
            type: 'info',
            message: 'flash.timeline-private',
            variables: {
              username: username
            }
          }]
        });
      }
      if (user[certType]) {
        const {
          completedChallenges = []
        } = user;
        const certChallenge = _lodash.default.find(completedChallenges, ({
          id
        }) => certId === id);
        let {
          completedDate = new Date()
        } = certChallenge || {};

        // the challenge id has been rotated for isDataVisCert
        if (certType === 'isDataVisCert' && !certChallenge) {
          let oldDataVisIdChall = _lodash.default.find(completedChallenges, ({
            id
          }) => _certificationSettings.oldDataVizId === id);
          if (oldDataVisIdChall) {
            completedDate = oldDataVisIdChall.completedDate || completedDate;
          }
        }

        // if fullcert is not found, return the latest completedDate
        if (certType === 'isFullStackCert' && !certChallenge) {
          completedDate = getFallbackFullStackDate(completedChallenges, completedDate);
        }
        const {
          username,
          name
        } = user;
        if (!showName) {
          return res.json({
            certSlug,
            certTitle,
            username,
            date: completedDate,
            completionTime
          });
        }
        return res.json({
          certSlug,
          certTitle,
          username,
          name,
          date: completedDate,
          completionTime
        });
      }
      return res.json({
        messages: [{
          type: 'info',
          message: 'flash.user-not-certified',
          variables: {
            username: username,
            cert: _certificationSettings.certTypeTitleMap[certType]
          }
        }]
      });
    }, next);
  };
}