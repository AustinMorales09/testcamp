"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateUserCompletedExamSchema = exports.validateGeneratedExamSchema = exports.validateExamResultsSchema = exports.validateExamFromDbSchema = void 0;
var _joi = _interopRequireDefault(require("joi"));
var _joiObjectid = _interopRequireDefault(require("joi-objectid"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
_joi.default.objectId = (0, _joiObjectid.default)(_joi.default);
const nanoIdRE = new RegExp('[a-z0-9]{10}');

// Exam from database schema
const DbPrerequisitesJoi = _joi.default.object().keys({
  id: _joi.default.objectId().required(),
  title: _joi.default.string()
});
const DbAnswerJoi = _joi.default.object().keys({
  id: _joi.default.string().regex(nanoIdRE).required(),
  deprecated: _joi.default.bool(),
  answer: _joi.default.string().required()
});
const DbQuestionJoi = _joi.default.object().keys({
  id: _joi.default.string().regex(nanoIdRE).required(),
  question: _joi.default.string().required(),
  deprecated: _joi.default.bool(),
  wrongAnswers: _joi.default.array().items(DbAnswerJoi).required().custom((value, helpers) => {
    const nonDeprecatedCount = value.reduce((count, answer) => answer.deprecated ? count : count + 1, 0);
    const minimumAnswers = 4;
    if (nonDeprecatedCount < minimumAnswers) {
      return helpers.message(`'wrongAnswers' must have at least ${minimumAnswers} non-deprecated answers.`);
    }
    return value;
  }),
  correctAnswers: _joi.default.array().items(DbAnswerJoi).required().custom((value, helpers) => {
    const nonDeprecatedCount = value.reduce((count, answer) => answer.deprecated ? count : count + 1, 0);
    const minimumAnswers = 1;
    if (nonDeprecatedCount < minimumAnswers) {
      return helpers.message(`'correctAnswers' must have at least ${minimumAnswers} non-deprecated answer.`);
    }
    return value;
  })
});
const examFromDbSchema = _joi.default.object().keys({
  // TODO: make sure _id and title match what's in the challenge markdown file
  id: _joi.default.objectId().required(),
  title: _joi.default.string().required(),
  numberOfQuestionsInExam: _joi.default.number().min(1).max(_joi.default.ref('questions', {
    adjust: questions => {
      const nonDeprecatedCount = questions.reduce((count, question) => question.deprecated ? count : count + 1, 0);
      return nonDeprecatedCount;
    }
  })).required(),
  passingPercent: _joi.default.number().min(0).max(100).required(),
  prerequisites: _joi.default.array().items(DbPrerequisitesJoi),
  questions: _joi.default.array().items(DbQuestionJoi).min(1).required()
});
const validateExamFromDbSchema = exam => {
  return examFromDbSchema.validate(exam);
};

// Generated Exam Schema
exports.validateExamFromDbSchema = validateExamFromDbSchema;
const GeneratedAnswerJoi = _joi.default.object().keys({
  id: _joi.default.string().regex(nanoIdRE).required(),
  answer: _joi.default.string().required()
});
const GeneratedQuestionJoi = _joi.default.object().keys({
  id: _joi.default.string().regex(nanoIdRE).required(),
  question: _joi.default.string().required(),
  answers: _joi.default.array().items(GeneratedAnswerJoi).min(5).required()
});
const generatedExamSchema = _joi.default.array().items(GeneratedQuestionJoi).min(1).required();
const validateGeneratedExamSchema = (exam, numberOfQuestionsInExam) => {
  if (!exam.length === numberOfQuestionsInExam) {
    throw new Error('The number of exam questions generated does not match the number of questions required.');
  }
  return generatedExamSchema.validate(exam);
};

// User Completed Exam Schema
exports.validateGeneratedExamSchema = validateGeneratedExamSchema;
const UserCompletedQuestionJoi = _joi.default.object().keys({
  id: _joi.default.string().regex(nanoIdRE).required(),
  question: _joi.default.string().required(),
  answer: _joi.default.object().keys({
    id: _joi.default.string().regex(nanoIdRE).required(),
    answer: _joi.default.string().required()
  })
});
const userCompletedExamSchema = _joi.default.object().keys({
  userExamQuestions: _joi.default.array().items(UserCompletedQuestionJoi).min(1).required(),
  examTimeInSeconds: _joi.default.number().min(0)
});
const validateUserCompletedExamSchema = (exam, numberOfQuestionsInExam) => {
  // TODO: Validate that the properties exist
  if (!exam.length === numberOfQuestionsInExam) {
    throw new Error('The number of exam questions answered does not match the number of questions required.');
  }
  return userCompletedExamSchema.validate(exam);
};

// Exam Results Schema
exports.validateUserCompletedExamSchema = validateUserCompletedExamSchema;
const examResultsSchema = _joi.default.object().keys({
  numberOfCorrectAnswers: _joi.default.number().min(0),
  numberOfQuestionsInExam: _joi.default.number().min(0),
  percentCorrect: _joi.default.number().min(0),
  passingPercent: _joi.default.number().min(0).max(100),
  passed: _joi.default.bool(),
  examTimeInSeconds: _joi.default.number().min(0)
});
const validateExamResultsSchema = examResults => {
  return examResultsSchema.validate(examResults);
};
exports.validateExamResultsSchema = validateExamResultsSchema;