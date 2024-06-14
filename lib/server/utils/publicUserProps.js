"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getProgress = getProgress;
exports.normaliseUserFields = normaliseUserFields;
exports.userPropsForSession = exports.publicUserProps = void 0;
var _validator = require("validator");
const publicUserProps = exports.publicUserProps = ['about', 'calendar', 'completedChallenges', 'completedExams', 'completedSurveys', 'githubProfile', 'isApisMicroservicesCert', 'isBackEndCert', 'isCheater', 'isDonating', 'is2018DataVisCert', 'isDataVisCert', 'isFrontEndCert', 'isFullStackCert', 'isFrontEndLibsCert', 'isHonest', 'isInfosecQaCert', 'isQaCertV7', 'isInfosecCertV7', 'isJsAlgoDataStructCert', 'isRelationalDatabaseCertV8', 'isRespWebDesignCert', 'isSciCompPyCertV7', 'isDataAnalysisPyCertV7', 'isMachineLearningPyCertV7', 'isCollegeAlgebraPyCertV8', 'isFoundationalCSharpCertV8', 'isJsAlgoDataStructCertV8', 'linkedin', 'location', 'name', 'partiallyCompletedChallenges', 'points', 'portfolio', 'profileUI', 'projects', 'savedChallenges', 'twitter', 'username', 'website', 'yearsTopContributor'];
const userPropsForSession = exports.userPropsForSession = [...publicUserProps, 'currentChallengeId', 'email', 'emailVerified', 'id', 'sendQuincyEmail', 'theme', 'keyboardShortcuts', 'completedChallengeCount', 'acceptedPrivacyTerms'];
function normaliseUserFields(user) {
  const about = user.bio && !user.about ? user.bio : user.about;
  const picture = user.picture || '';
  const twitter = user.twitter && (0, _validator.isURL)(user.twitter) ? user.twitter : user.twitter && `https://www.twitter.com/${user.twitter.replace(/^@/, '')}`;
  return {
    about,
    picture,
    twitter
  };
}
function getProgress(progressTimestamps) {
  const calendar = progressTimestamps.filter(Boolean).reduce((data, timestamp) => {
    data[Math.floor(timestamp / 1000)] = 1;
    return data;
  }, {});
  return {
    calendar
  };
}