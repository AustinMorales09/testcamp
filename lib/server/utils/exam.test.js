"use strict";

var _exam = require("./exam");
var _exam2 = require("./__mocks__/exam");
describe('Exam helpers', () => {
  describe('generateRandomExam()', () => {
    const randomizedExam = (0, _exam.generateRandomExam)(_exam2.examJson);
    it('should have one question', () => {
      expect(randomizedExam.length).toBe(1);
    });
    it('should have five answers', () => {
      const firstQuestion = randomizedExam[0];
      expect(firstQuestion.answers.length).toBe(5);
    });
    it('should have exactly one correct answer', () => {
      const question = randomizedExam[0];
      const questionId = question.id;
      const originalQuestion = _exam2.examJson.questions.find(q => q.id === questionId);
      const originalCorrectAnswer = originalQuestion.correctAnswers;
      const correctIds = originalCorrectAnswer.map(a => a.id);
      const numberOfCorrectAnswers = question.answers.filter(a => correctIds.includes(a.id));
      expect(numberOfCorrectAnswers).toHaveLength(1);
    });
  });
  describe('createExamResults()', () => {
    _exam2.examJson.numberOfQuestionsInExam = 2;
    const examResults1 = (0, _exam.createExamResults)(_exam2.userExam1, _exam2.examJson);
    const examResults2 = (0, _exam.createExamResults)(_exam2.userExam2, _exam2.examJson);
    it('failing exam should return correct results', () => {
      expect(examResults1).toEqual(_exam2.mockResults1);
    });
    it('passing exam should return correct results', () => {
      expect(examResults2).toEqual(_exam2.mockResults2);
    });
  });
});