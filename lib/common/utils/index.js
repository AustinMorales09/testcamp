"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "decodeEmail", {
  enumerable: true,
  get: function () {
    return _auth.decodeEmail;
  }
});
exports.fixSavedChallengeItem = exports.fixPartiallyCompletedChallengeItem = exports.fixCompletedSurveyItem = exports.fixCompletedExamItem = exports.fixCompletedChallengeItem = void 0;
Object.defineProperty(exports, "getEncodedEmail", {
  enumerable: true,
  get: function () {
    return _auth.getEncodedEmail;
  }
});
Object.defineProperty(exports, "getWaitMessage", {
  enumerable: true,
  get: function () {
    return _auth.getWaitMessage;
  }
});
Object.defineProperty(exports, "getWaitPeriod", {
  enumerable: true,
  get: function () {
    return _auth.getWaitPeriod;
  }
});
Object.defineProperty(exports, "renderEmailChangeEmail", {
  enumerable: true,
  get: function () {
    return _auth.renderEmailChangeEmail;
  }
});
Object.defineProperty(exports, "renderSignInEmail", {
  enumerable: true,
  get: function () {
    return _auth.renderSignInEmail;
  }
});
Object.defineProperty(exports, "renderSignUpEmail", {
  enumerable: true,
  get: function () {
    return _auth.renderSignUpEmail;
  }
});
var _lodash = require("lodash");
var _auth = require("./auth");
const fixCompletedChallengeItem = obj => (0, _lodash.pick)(obj, ['id', 'completedDate', 'solution', 'githubLink', 'challengeType', 'files', 'isManuallyApproved', 'examResults']);
exports.fixCompletedChallengeItem = fixCompletedChallengeItem;
const fixSavedChallengeItem = obj => (0, _lodash.pick)(obj, ['id', 'lastSavedDate', 'files']);
exports.fixSavedChallengeItem = fixSavedChallengeItem;
const fixPartiallyCompletedChallengeItem = obj => (0, _lodash.pick)(obj, ['id', 'completedDate']);
exports.fixPartiallyCompletedChallengeItem = fixPartiallyCompletedChallengeItem;
const fixCompletedExamItem = obj => (0, _lodash.pick)(obj, ['id', 'completedDate', 'challengeType', 'examResults']);
exports.fixCompletedExamItem = fixCompletedExamItem;
const fixCompletedSurveyItem = obj => (0, _lodash.pick)(obj, ['title', 'responses']);
exports.fixCompletedSurveyItem = fixCompletedSurveyItem;