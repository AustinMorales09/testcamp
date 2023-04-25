"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getProgress = getProgress;
exports.normaliseUserFields = normaliseUserFields;
exports.userPropsForSession = exports.publicUserProps = void 0;
var _validator = require("validator");
var _userStats = require("../utils/user-stats");
const publicUserProps = ['about', 'calendar', 'completedChallenges', 'githubProfile', 'isApisMicroservicesCert', 'isBackEndCert', 'isCheater', 'isDonating', 'is2018DataVisCert', 'isDataVisCert', 'isFrontEndCert', 'isFullStackCert', 'isFrontEndLibsCert', 'isHonest', 'isInfosecQaCert', 'isQaCertV7', 'isInfosecCertV7', 'isJsAlgoDataStructCert', 'isRelationalDatabaseCertV8', 'isRespWebDesignCert', 'isSciCompPyCertV7', 'isDataAnalysisPyCertV7', 'isMachineLearningPyCertV7', 'linkedin', 'location', 'name', 'partiallyCompletedChallenges', 'points', 'portfolio', 'profileUI', 'projects', 'savedChallenges', 'streak', 'twitter', 'username', 'website', 'yearsTopContributor'];
exports.publicUserProps = publicUserProps;
const userPropsForSession = [...publicUserProps, 'currentChallengeId', 'email', 'emailVerified', 'id', 'sendQuincyEmail', 'theme', 'sound', 'keyboardShortcuts', 'completedChallengeCount', 'completedProjectCount', 'completedCertCount', 'completedLegacyCertCount', 'acceptedPrivacyTerms', 'donationEmails'];
exports.userPropsForSession = userPropsForSession;
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
function getProgress(progressTimestamps, timezone = 'EST') {
  const calendar = progressTimestamps.filter(Boolean).reduce((data, timestamp) => {
    data[Math.floor(timestamp / 1000)] = 1;
    return data;
  }, {});
  const uniqueHours = (0, _userStats.prepUniqueDaysByHours)(progressTimestamps, timezone);
  const streak = {
    longest: (0, _userStats.calcLongestStreak)(uniqueHours, timezone),
    current: (0, _userStats.calcCurrentStreak)(uniqueHours, timezone)
  };
  return {
    calendar,
    streak
  };
}