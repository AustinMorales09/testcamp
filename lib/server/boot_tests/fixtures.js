"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDonationMockFn = void 0;
exports.createNewUserFromEmail = createNewUserFromEmail;
exports.updateUserAttr = exports.updateDonationAttr = exports.requestedChallengeUrl = exports.mockUserID = exports.mockUser = exports.mockGetFirstChallenge = exports.mockFirstChallenge = exports.mockDonation = exports.mockCompletedChallenges = exports.mockCompletedChallengeNoFiles = exports.mockCompletedChallenge = exports.mockChallenge = exports.mockApp = exports.mockAllChallenges = exports.matchUserIdQuery = exports.matchSubscriptionIdQuery = exports.matchEmailQuery = exports.fullStackChallenges = exports.firstChallengeUrl = exports.createUserMockFn = void 0;
var _lodash = require("lodash");
var _validator = require("validator");
const firstChallengeUrl = '/learn/the/first/challenge';
exports.firstChallengeUrl = firstChallengeUrl;
const requestedChallengeUrl = '/learn/my/actual/challenge';
exports.requestedChallengeUrl = requestedChallengeUrl;
const mockChallenge = {
  id: '123abc',
  block: 'actual',
  superBlock: 'my',
  dashedName: 'challenge'
};
exports.mockChallenge = mockChallenge;
const mockFirstChallenge = {
  id: '456def',
  block: 'first',
  superBlock: 'the',
  dashedName: 'challenge',
  challengeOrder: 0,
  superOrder: 0,
  order: 0
};
exports.mockFirstChallenge = mockFirstChallenge;
const mockCompletedChallenge = {
  id: '890xyz',
  challengeType: 0,
  files: [{
    contents: 'file contents',
    key: 'indexfile',
    name: 'index',
    path: 'index.file',
    ext: 'file'
  }],
  completedDate: Date.now()
};
exports.mockCompletedChallenge = mockCompletedChallenge;
const mockCompletedChallengeNoFiles = {
  id: '123abc456def',
  challengeType: 0,
  completedDate: Date.now()
};
exports.mockCompletedChallengeNoFiles = mockCompletedChallengeNoFiles;
const mockCompletedChallenges = [{
  id: 'bd7123c8c441eddfaeb5bdef',
  completedDate: 1538052380328.0
}, {
  id: '587d7dbd367417b2b2512bb4',
  completedDate: 1547472893032.0,
  files: []
}, {
  id: 'aaa48de84e1ecc7c742e1124',
  completedDate: 1541678430790.0,
  files: [{
    contents:
    // eslint-disable-next-line max-len
    "function palindrome(str) {\n  const clean = str.replace(/[\\W_]/g, '').toLowerCase()\n  const revStr = clean.split('').reverse().join('');\n  return clean === revStr;\n}\n\n\n\npalindrome(\"eye\");\n",
    ext: 'js',
    path: 'index.js',
    name: 'index',
    key: 'indexjs'
  }]
}, {
  id: '5a24c314108439a4d4036164',
  completedDate: 1543845124143.0,
  files: []
}];
exports.mockCompletedChallenges = mockCompletedChallenges;
const mockUserID = '5c7d892aff9777c8b1c1a95e';
exports.mockUserID = mockUserID;
const createUserMockFn = jest.fn();
exports.createUserMockFn = createUserMockFn;
const createDonationMockFn = jest.fn();
exports.createDonationMockFn = createDonationMockFn;
const updateDonationAttr = jest.fn();
exports.updateDonationAttr = updateDonationAttr;
const updateUserAttr = jest.fn();
exports.updateUserAttr = updateUserAttr;
const mockUser = {
  id: mockUserID,
  username: 'camperbot',
  currentChallengeId: '123abc',
  email: 'donor@freecodecamp.com',
  timezone: 'UTC',
  completedChallenges: mockCompletedChallenges,
  progressTimestamps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  isDonating: true,
  donationEmails: ['donor@freecodecamp.com', 'donor@freecodecamp.com'],
  createDonation: donation => {
    createDonationMockFn(donation);
    return mockObservable;
  },
  updateAttributes: updateUserAttr
};
exports.mockUser = mockUser;
const mockObservable = {
  toPromise: () => Promise.resolve('result')
};
const mockDonation = {
  id: '5e5f8eda5ed7be2b54e18718',
  email: 'donor@freecodecamp.com',
  provider: 'paypal',
  amount: 500,
  duration: 'month',
  startDate: {
    _when: '2018-11-01T00:00:00.000Z',
    _date: '2018-11-01T00:00:00.000Z'
  },
  subscriptionId: 'I-BA1ATBNF8T3P',
  userId: mockUserID,
  updateAttributes: updateDonationAttr
};
exports.mockDonation = mockDonation;
function createNewUserFromEmail(email) {
  const newMockUser = mockUser;
  newMockUser.email = email;
  newMockUser.username = 'camberbot2';
  newMockUser.ID = '5c7d892aff9888c8b1c1a95e';
  return newMockUser;
}
const mockApp = {
  models: {
    Donation: {
      findOne(query, cb) {
        return (0, _lodash.isEqual)(query, matchSubscriptionIdQuery) ? cb(null, mockDonation) : cb(Error('No Donation'));
      }
    },
    User: {
      findById(id, cb) {
        if (id === mockUser.id) {
          return cb(null, mockUser);
        }
        return cb(Error('No user'));
      },
      findOne(query, cb) {
        if ((0, _lodash.isEqual)(query, matchEmailQuery) || (0, _lodash.isEqual)(query, matchUserIdQuery)) return cb(null, mockUser);
        return cb(null, null);
      },
      create(query, cb) {
        if (!(0, _validator.isEmail)(query.email)) return cb(new Error('email not valid'));else if (query.email === mockUser.email) return cb(new Error('user exist'));
        createUserMockFn();
        return Promise.resolve(createNewUserFromEmail(query.email));
      }
    }
  }
};
exports.mockApp = mockApp;
const mockAllChallenges = [mockFirstChallenge, mockChallenge];
exports.mockAllChallenges = mockAllChallenges;
const mockGetFirstChallenge = () => firstChallengeUrl;
exports.mockGetFirstChallenge = mockGetFirstChallenge;
const matchEmailQuery = {
  where: {
    email: mockUser.email
  }
};
exports.matchEmailQuery = matchEmailQuery;
const matchSubscriptionIdQuery = {
  where: {
    subscriptionId: mockDonation.subscriptionId
  }
};
exports.matchSubscriptionIdQuery = matchSubscriptionIdQuery;
const matchUserIdQuery = {
  where: {
    id: mockUser.id
  }
};
exports.matchUserIdQuery = matchUserIdQuery;
const fullStackChallenges = [{
  completedDate: 1585210952511,
  id: '5a553ca864b52e1d8bceea14',
  challengeType: 7,
  files: []
}, {
  completedDate: 1585210952511,
  id: '561add10cb82ac38a17513bc',
  challengeType: 7,
  files: []
}, {
  completedDate: 1588665778679,
  id: '561acd10cb82ac38a17513bc',
  challengeType: 7,
  files: []
}, {
  completedDate: 1685210952511,
  id: '561abd10cb81ac38a17513bc',
  challengeType: 7,
  files: []
}, {
  completedDate: 1585210952511,
  id: '561add10cb82ac38a17523bc',
  challengeType: 7,
  files: []
}, {
  completedDate: 1588665778679,
  id: '561add10cb82ac38a17213bc',
  challengeType: 7,
  files: []
}];
exports.fullStackChallenges = fullStackChallenges;