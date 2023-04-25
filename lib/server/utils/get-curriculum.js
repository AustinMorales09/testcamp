"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getChallenges = getChallenges;
var _lodash = require("lodash");
var _curriculum = _interopRequireDefault(require("../../../configs/curriculum.json"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// TODO: keeping curriculum in memory is handy if we want to field requests that
// need to 'query' the curriculum, but if we force the client to handle
// redirectToCurrentChallenge and, instead, only report the current challenge id
// via the user object, then we should *not* store this so it can be garbage
// collected.

// eslint-disable-next-line import/no-unresolved

function getChallenges() {
  return Object.keys(_curriculum.default).map(key => _curriculum.default[key].blocks).reduce((challengeArray, superBlock) => {
    const challengesForBlock = Object.keys(superBlock).map(key => superBlock[key].challenges);
    return [...challengeArray, ...(0, _lodash.flatten)(challengesForBlock)];
  }, []);
}