"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getRequestAuthorisation;
exports.isAllowedPath = isAllowedPath;
var _lodash = require("lodash");
var _secrets = require("../../../config/secrets");
var _createHandledError = require("../utils/create-handled-error");
var _getSetAccessToken = require("../utils/getSetAccessToken");
var _redirection = require("../utils/redirection");
var _userStats = require("../utils/user-stats");
const authRE = /^\/auth\//;
const confirmEmailRE = /^\/confirm-email$/;
const newsShortLinksRE = /^\/n\/|^\/p\//;
const publicUserRE = /^\/api\/users\/get-public-profile$/;
const publicUsernameRE = /^\/api\/users\/exists$/;
const resubscribeRE = /^\/resubscribe\//;
const showCertRE = /^\/certificate\/showCert\//;
// note: signin may not have a trailing slash
const signinRE = /^\/signin/;
const statusRE = /^\/status\/ping$/;
const unsubscribedRE = /^\/unsubscribed\//;
const unsubscribeRE = /^\/u\/|^\/unsubscribe\/|^\/ue\//;
// note: this would be replaced by webhooks later
const donateRE = /^\/donate\/charge-stripe$/;
const submitCoderoadChallengeRE = /^\/coderoad-challenge-completed$/;
const mobileLoginRE = /^\/mobile-login\/?$/;
const _pathsAllowedREs = [authRE, confirmEmailRE, newsShortLinksRE, publicUserRE, publicUsernameRE, resubscribeRE, showCertRE, signinRE, statusRE, unsubscribedRE, unsubscribeRE, donateRE, submitCoderoadChallengeRE, mobileLoginRE];
function isAllowedPath(path, pathsAllowedREs = _pathsAllowedREs) {
  return pathsAllowedREs.some(re => re.test(path));
}
function getRequestAuthorisation({
  jwtSecret = _secrets.jwtSecret,
  getUserById = _userStats.getUserById
} = {}) {
  return function requestAuthorisation(req, res, next) {
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    const {
      path
    } = req;
    if (!isAllowedPath(path)) {
      const {
        accessToken,
        error
      } = (0, _getSetAccessToken.getAccessTokenFromRequest)(req, jwtSecret);
      if (!accessToken && error === _getSetAccessToken.errorTypes.noTokenFound) {
        throw (0, _createHandledError.wrapHandledError)(new Error('Access token is required for this request'), {
          type: 'info',
          redirect: `${origin}/signin`,
          message: 'Access token is required for this request',
          status: 403
        });
      }
      if (!accessToken && error === _getSetAccessToken.errorTypes.invalidToken) {
        throw (0, _createHandledError.wrapHandledError)(new Error('Access token is invalid'), {
          type: 'info',
          redirect: `${origin}/signin`,
          message: 'Your access token is invalid',
          status: 403
        });
      }
      if (!accessToken && error === _getSetAccessToken.errorTypes.expiredToken) {
        throw (0, _createHandledError.wrapHandledError)(new Error('Access token is no longer valid'), {
          type: 'info',
          redirect: `${origin}/signin`,
          message: 'Access token is no longer valid',
          status: 403
        });
      }
      if ((0, _lodash.isEmpty)(req.user)) {
        const {
          userId
        } = accessToken;
        return getUserById(userId).then(user => {
          if (user) {
            req.user = user;
          }
          return;
        }).then(next).catch(next);
      } else {
        return Promise.resolve(next());
      }
    }
    return Promise.resolve(next());
  };
}