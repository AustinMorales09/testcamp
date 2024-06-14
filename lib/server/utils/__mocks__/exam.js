"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userExam2 = exports.userExam1 = exports.mockResults2 = exports.mockResults1 = exports.examJson = void 0;
const examJson = exports.examJson = {
  id: 1,
  numberOfQuestionsInExam: 1,
  passingPercent: 70,
  questions: [{
    id: '3bbl2mx2mq',
    question: 'Question 1?',
    wrongAnswers: [{
      id: 'ex7hii9zup',
      answer: 'Q1: Wrong Answer 1'
    }, {
      id: 'lmr1ew7m67',
      answer: 'Q1: Wrong Answer 2'
    }, {
      id: 'qh5sz9qdiq',
      answer: 'Q1: Wrong Answer 3'
    }, {
      id: 'g489kbwn6a',
      answer: 'Q1: Wrong Answer 4'
    }, {
      id: '7vu84wl4lc',
      answer: 'Q1: Wrong Answer 5'
    }, {
      id: 'em59kw6avu',
      answer: 'Q1: Wrong Answer 6'
    }],
    correctAnswers: [{
      id: 'dzlokqdc73',
      answer: 'Q1: Correct Answer 1'
    }, {
      id: 'f5gk39ske9',
      answer: 'Q1: Correct Answer 2'
    }]
  }, {
    id: 'oqis5gzs0h',
    question: 'Question 2?',
    wrongAnswers: [{
      id: 'ojhnoxh5r5',
      answer: 'Q2: Wrong Answer 1'
    }, {
      id: 'onx06if0uh',
      answer: 'Q2: Wrong Answer 2'
    }, {
      id: 'zbxnsko712',
      answer: 'Q2: Wrong Answer 3'
    }, {
      id: 'bqv5y68jyp',
      answer: 'Q2: Wrong Answer 4'
    }, {
      id: 'i5xipitiss',
      answer: 'Q2: Wrong Answer 5'
    }, {
      id: 'wycrnloajd',
      answer: 'Q2: Wrong Answer 6'
    }],
    correctAnswers: [{
      id: 't9ezcsupdl',
      answer: 'Q1: Correct Answer 1'
    }, {
      id: 'agert35dk0',
      answer: 'Q1: Correct Answer 2'
    }]
  }]
};

// failed
const userExam1 = exports.userExam1 = {
  userExamQuestions: [{
    id: '3bbl2mx2mq',
    question: 'Question 1?',
    answer: {
      id: 'dzlokqdc73',
      answer: 'Q1: Correct Answer 1'
    }
  }, {
    id: 'oqis5gzs0h',
    question: 'Question 2?',
    answer: {
      id: 'i5xipitiss',
      answer: 'Q2: Wrong Answer 5'
    }
  }],
  examTimeInSeconds: 20
};

// passed
const userExam2 = exports.userExam2 = {
  userExamQuestions: [{
    id: '3bbl2mx2mq',
    question: 'Question 1?',
    answer: {
      id: 'dzlokqdc73',
      answer: 'Q1: Correct Answer 1'
    }
  }, {
    id: 'oqis5gzs0h',
    question: 'Question 2?',
    answer: {
      id: 't9ezcsupdl',
      answer: 'Q1: Correct Answer 1'
    }
  }],
  examTimeInSeconds: 20
};
const mockResults1 = exports.mockResults1 = {
  numberOfCorrectAnswers: 1,
  numberOfQuestionsInExam: 2,
  percentCorrect: 50,
  passingPercent: 70,
  passed: false,
  examTimeInSeconds: 20
};
const mockResults2 = exports.mockResults2 = {
  numberOfCorrectAnswers: 2,
  numberOfQuestionsInExam: 2,
  percentCorrect: 100,
  passingPercent: 70,
  passed: true,
  examTimeInSeconds: 20
};