"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDeleteMsUsername = createDeleteMsUsername;
var _debug = _interopRequireDefault(require("debug"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const log = (0, _debug.default)('fcc:boot:user');
function createDeleteMsUsername(app) {
  const {
    MsUsername
  } = app.models;
  return async function deleteMsUsername(req, res, next) {
    try {
      await MsUsername.destroyAll({
        userId: req.user.id
      });
      req.msUsernameDeleted = true;
    } catch (e) {
      req.msUsernameDeleted = false;
      log(`An error occurred deleting Microsoft username for user with id ${req.user.id}`);
    }
    next();
  };
}