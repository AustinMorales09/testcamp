"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = populateUser;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function getCompletedCertCount(user) {
  return ['isApisMicroservicesCert', 'is2018DataVisCert', 'isFrontEndLibsCert', 'isQaCertV7', 'isInfosecCertV7', 'isJsAlgoDataStructCert', 'isRespWebDesignCert', 'isSciCompPyCertV7', 'isDataAnalysisPyCertV7', 'isMachineLearningPyCertV7', 'isRelationalDatabaseCertV8'].reduce((sum, key) => user[key] ? sum + 1 : sum, 0);
}
function getLegacyCertCount(user) {
  return ['isFrontEndCert', 'isBackEndCert', 'isDataVisCert', 'isInfosecQaCert'].reduce((sum, key) => user[key] ? sum + 1 : sum, 0);
}
function populateUser(db, user) {
  return new Promise((resolve, reject) => {
    let populatedUser = _objectSpread({}, user);
    db.collection('user').aggregate([{
      $match: {
        _id: user.id
      }
    }, {
      $project: {
        points: {
          $size: '$progressTimestamps'
        }
      }
    }]).get(function (err, [{
      points = 1
    } = {}]) {
      if (err) {
        return reject(err);
      }
      user.points = points;
      let completedChallengeCount = 0;
      let completedProjectCount = 0;
      if ('completedChallenges' in user) {
        completedChallengeCount = user.completedChallenges.length;
        user.completedChallenges.forEach(item => {
          if ('challengeType' in item && (item.challengeType === 3 || item.challengeType === 4)) {
            completedProjectCount++;
          }
        });
      }
      populatedUser.completedChallengeCount = completedChallengeCount;
      populatedUser.completedProjectCount = completedProjectCount;
      populatedUser.completedCertCount = getCompletedCertCount(user);
      populatedUser.completedLegacyCertCount = getLegacyCertCount(user);
      populatedUser.completedChallenges = [];
      return resolve(populatedUser);
    });
  });
}