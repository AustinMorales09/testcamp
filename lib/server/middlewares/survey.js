"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDeleteUserSurveys = createDeleteUserSurveys;
exports.validateSurvey = validateSurvey;
var _debug = _interopRequireDefault(require("debug"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const log = (0, _debug.default)('fcc:boot:user');
const allowedTitles = ['Foundational C# with Microsoft Survey'];
function validateSurvey(req, res, next) {
  const {
    title,
    responses
  } = req.body.surveyResults || {
    title: '',
    responses: []
  };
  if (!allowedTitles.includes(title) || !Array.isArray(responses) || !responses.every(r => typeof r.question === 'string' && typeof r.response === 'string')) {
    return res.status(400).json({
      type: 'error',
      message: 'flash.survey.err-1'
    });
  }
  next();
}
function createDeleteUserSurveys(app) {
  const {
    Survey
  } = app.models;
  return async function deleteUserSurveys(req, res, next) {
    try {
      await Survey.destroyAll({
        userId: req.user.id
      });
      req.userSurveysDeleted = true;
    } catch (e) {
      req.userSurveysDeleted = false;
      log(`An error occurred deleting Surveys for user with id ${req.user.id}`);
    }
    next();
  };
}