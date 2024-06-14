"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDeleteUserToken = createDeleteUserToken;
exports.encodeUserToken = encodeUserToken;
var _debug = _interopRequireDefault(require("debug"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _secrets = require("../../../config/secrets");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const log = (0, _debug.default)('fcc:boot:user');
/*
 * User tokens for submitting external curriculum are deleted when they sign
 * out, reset their account, or delete their account
 */

function createDeleteUserToken(app) {
  const {
    UserToken
  } = app.models;
  return async function deleteUserToken(req, res, next) {
    try {
      await UserToken.destroyAll({
        userId: req.user.id
      });
      req.userTokenDeleted = true;
    } catch (e) {
      req.userTokenDeleted = false;
      log(`An error occurred deleting user token for user with id ${req.user.id}`);
    }
    next();
  };
}
function encodeUserToken(userToken) {
  return _jsonwebtoken.default.sign({
    userToken
  }, _secrets.jwtSecret);
}