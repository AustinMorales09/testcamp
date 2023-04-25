"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = populateUser;
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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