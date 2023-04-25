"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calcCurrentStreak = calcCurrentStreak;
exports.calcLongestStreak = calcLongestStreak;
exports.getUserById = getUserById;
exports.prepUniqueDaysByHours = prepUniqueDaysByHours;
var _lodash = require("lodash");
var _compose = _interopRequireDefault(require("lodash/fp/compose"));
var _forEachRight = _interopRequireDefault(require("lodash/fp/forEachRight"));
var _last = _interopRequireDefault(require("lodash/fp/last"));
var _map = _interopRequireDefault(require("lodash/fp/map"));
var _sortBy = _interopRequireDefault(require("lodash/fp/sortBy"));
var _transform = _interopRequireDefault(require("lodash/fp/transform"));
var _loopback = _interopRequireDefault(require("loopback"));
var _momentTimezone = _interopRequireDefault(require("moment-timezone"));
var _dateUtils = require("../utils/date-utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const transform = _transform.default.convert({
  cap: false
});
const hoursBetween = 24;
const hoursDay = 24;
function prepUniqueDaysByHours(cals, tz = 'UTC') {
  let prev = null;

  // compose goes bottom to top (map > sortBy > transform)
  return (0, _compose.default)(transform((data, cur, i) => {
    if (i < 1) {
      data.push(cur);
      prev = cur;
    } else if ((0, _momentTimezone.default)(cur).tz(tz).diff((0, _momentTimezone.default)(prev).tz(tz).startOf('day'), 'hours') >= hoursDay) {
      data.push(cur);
      prev = cur;
    }
  }, []), (0, _sortBy.default)(e => e), (0, _map.default)(ts => (0, _momentTimezone.default)(ts).tz(tz).startOf('hours').valueOf()))(cals);
}
function calcCurrentStreak(cals, tz = 'UTC') {
  let prev = (0, _last.default)(cals);
  if ((0, _momentTimezone.default)().tz(tz).startOf('day').diff((0, _momentTimezone.default)(prev).tz(tz), 'hours') > hoursBetween) {
    return 0;
  }
  let currentStreak = 0;
  let streakContinues = true;
  (0, _forEachRight.default)(cur => {
    if ((0, _momentTimezone.default)(prev).tz(tz).startOf('day').diff((0, _momentTimezone.default)(cur).tz(tz), 'hours') <= hoursBetween) {
      prev = cur;
      currentStreak++;
    } else {
      // current streak found
      streakContinues = false;
    }
    return streakContinues;
  })(cals);
  return currentStreak;
}
function calcLongestStreak(cals, tz = 'UTC') {
  let tail = cals[0];
  const longest = cals.reduce((longest, head, index) => {
    const last = cals[index === 0 ? 0 : index - 1];
    // is streak broken
    if ((0, _momentTimezone.default)(head).tz(tz).startOf('day').diff((0, _momentTimezone.default)(last).tz(tz), 'hours') > hoursBetween) {
      tail = head;
    }
    if ((0, _dateUtils.dayCount)(longest, tz) < (0, _dateUtils.dayCount)([head, tail], tz)) {
      return [head, tail];
    }
    return longest;
  }, [cals[0], cals[0]]);
  return (0, _dateUtils.dayCount)(longest, tz);
}
function getUserById(id, User = _loopback.default.getModelByType('User')) {
  return new Promise((resolve, reject) => User.findById(id, (err, instance) => {
    if (err || (0, _lodash.isEmpty)(instance)) {
      return reject(err || 'No user instance found');
    }
    let completedChallengeCount = 0;
    let completedProjectCount = 0;
    if ('completedChallenges' in instance) {
      completedChallengeCount = instance.completedChallenges.length;
      instance.completedChallenges.forEach(item => {
        if ('challengeType' in item && (item.challengeType === 3 || item.challengeType === 4)) {
          completedProjectCount++;
        }
      });
    }
    instance.completedChallengeCount = completedChallengeCount;
    instance.completedProjectCount = completedProjectCount;
    instance.completedCertCount = getCompletedCertCount(instance);
    instance.completedLegacyCertCount = getLegacyCertCount(instance);
    instance.points = instance.progressTimestamps && instance.progressTimestamps.length || 1;
    return resolve(instance);
  }));
}
function getCompletedCertCount(user) {
  return ['isApisMicroservicesCert', 'is2018DataVisCert', 'isFrontEndLibsCert', 'isQaCertV7', 'isInfosecCertV7', 'isJsAlgoDataStructCert', 'isRespWebDesignCert', 'isSciCompPyCertV7', 'isDataAnalysisPyCertV7', 'isMachineLearningPyCertV7', 'isRelationalDatabaseCertV8'].reduce((sum, key) => user[key] ? sum + 1 : sum, 0);
}
function getLegacyCertCount(user) {
  return ['isFrontEndCert', 'isBackEndCert', 'isDataVisCert', 'isInfosecQaCert'].reduce((sum, key) => user[key] ? sum + 1 : sum, 0);
}