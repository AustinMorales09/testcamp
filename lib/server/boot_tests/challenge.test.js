"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockRes = exports.mockReq = void 0;
var _lodash = require("lodash");
var _challenge = require("../boot/challenge");
var _fixtures = require("./fixtures");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const mockReq = opts => {
  const req = {};
  return _objectSpread(_objectSpread({}, req), opts);
};
exports.mockReq = mockReq;
const mockRes = opts => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return _objectSpread(_objectSpread({}, res), opts);
};
exports.mockRes = mockRes;
describe('boot/challenge', () => {
  xdescribe('backendChallengeCompleted', () => {});
  describe('buildUserUpdate', () => {
    it('returns an Object with a nested "completedChallenges" property', () => {
      const result = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, '123abc', _fixtures.mockCompletedChallenge, 'UTC');
      expect(result).toHaveProperty('updateData.$push.completedChallenges');
    });

    // eslint-disable-next-line max-len
    it('preserves file contents if the completed challenge is a JS Project', () => {
      const jsChallengeId = 'aa2e6f85cab2ab736c9a9b24';
      const completedChallenge = _objectSpread(_objectSpread({}, _fixtures.mockCompletedChallenge), {}, {
        completedDate: Date.now(),
        id: jsChallengeId
      });
      const result = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, jsChallengeId, completedChallenge, 'UTC');
      const newCompletedChallenge = result.updateData.$push.completedChallenges;
      expect(newCompletedChallenge).toEqual(completedChallenge);
    });
    it('preserves the original completed date of a challenge', () => {
      const completedChallengeId = 'aaa48de84e1ecc7c742e1124';
      const completedChallenge = _objectSpread(_objectSpread({}, _fixtures.mockCompletedChallenge), {}, {
        completedDate: Date.now(),
        id: completedChallengeId
      });
      const originalCompletion = (0, _lodash.find)(_fixtures.mockCompletedChallenges, x => x.id === completedChallengeId).completedDate;
      const result = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, completedChallengeId, completedChallenge, 'UTC');
      const updatedCompletedChallenge = result.updateData.$set['completedChallenges.2'];
      expect(updatedCompletedChallenge.completedDate).toEqual(originalCompletion);
    });

    // eslint-disable-next-line max-len
    it('does not attempt to update progressTimestamps for a previously completed challenge', () => {
      const completedChallengeId = 'aaa48de84e1ecc7c742e1124';
      const completedChallenge = _objectSpread(_objectSpread({}, _fixtures.mockCompletedChallenge), {}, {
        completedDate: Date.now(),
        id: completedChallengeId
      });
      const {
        updateData
      } = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, completedChallengeId, completedChallenge, 'UTC');
      const hasProgressTimestamps = '$push' in updateData && 'progressTimestamps' in updateData.$push;
      expect(hasProgressTimestamps).toBe(false);
    });

    // eslint-disable-next-line max-len
    it('provides a progressTimestamps update for new challenge completion', () => {
      expect.assertions(2);
      const {
        updateData
      } = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, '123abc', _fixtures.mockCompletedChallenge, 'UTC');
      expect(updateData).toHaveProperty('$push');
      expect(updateData.$push).toHaveProperty('progressTimestamps');
    });
    it('will $push newly completed challenges to the completedChallenges array', () => {
      const {
        updateData: {
          $push: {
            completedChallenges
          }
        }
      } = (0, _challenge.buildUserUpdate)(_fixtures.mockUser, '123abc', _fixtures.mockCompletedChallengeNoFiles, 'UTC');
      expect(completedChallenges).toEqual(_fixtures.mockCompletedChallengeNoFiles);
    });
  });
  describe('buildExamUserUpdate', () => {
    it('should $push exam results to completedExams[]', () => {
      const {
        updateData: {
          $push: {
            completedExams
          }
        }
      } = (0, _challenge.buildExamUserUpdate)(_fixtures.mockUser, _fixtures.mockFailingExamChallenge);
      expect(completedExams).toEqual(_fixtures.mockFailingExamChallenge);
    });
    it('should not add failing exams to completedChallenges[]', () => {
      const {
        alreadyCompleted,
        addPoint,
        updateData
      } = (0, _challenge.buildExamUserUpdate)(_fixtures.mockUser, _fixtures.mockFailingExamChallenge);
      expect(updateData).not.toHaveProperty('$push.completedChallenges');
      expect(updateData).not.toHaveProperty('$set.completedChallenges');
      expect(addPoint).toBe(false);
      expect(alreadyCompleted).toBe(false);
    });
    it('should $push newly passed exams to completedChallenge[]', () => {
      const {
        alreadyCompleted,
        addPoint,
        updateData: {
          $push: {
            completedChallenges
          }
        }
      } = (0, _challenge.buildExamUserUpdate)(_fixtures.mockUser, _fixtures.mockPassingExamChallenge);
      expect(completedChallenges).toEqual(_fixtures.mockPassingExamChallenge);
      expect(addPoint).toBe(true);
      expect(alreadyCompleted).toBe(false);
    });
    it('should not update passed exams with worse results in completedChallenge[]', () => {
      const {
        alreadyCompleted,
        addPoint,
        updateData
      } = (0, _challenge.buildExamUserUpdate)(_fixtures.mockUser2, _fixtures.mockWorsePassingExamChallenge);
      expect(updateData).not.toHaveProperty('$push.completedChallenges');
      expect(updateData).not.toHaveProperty('$set.completedChallenges');
      expect(addPoint).toBe(false);
      expect(alreadyCompleted).toBe(true);
    });
    it('should update passed exams with better results in completedChallenge[]', () => {
      const {
        alreadyCompleted,
        addPoint,
        completedDate,
        updateData: {
          $set
        }
      } = (0, _challenge.buildExamUserUpdate)(_fixtures.mockUser2, _fixtures.mockBetterPassingExamChallenge);
      expect($set['completedChallenges.4'].examResults).toEqual(_fixtures.mockBetterPassingExamChallenge.examResults);
      expect(addPoint).toBe(false);
      expect(alreadyCompleted).toBe(true);
      expect(completedDate).toBe(1538052380328);
    });
  });
  describe('buildChallengeUrl', () => {
    it('resolves the correct Url for the provided challenge', () => {
      const result = (0, _challenge.buildChallengeUrl)(_fixtures.mockChallenge);
      expect(result).toEqual(_fixtures.requestedChallengeUrl);
    });
  });
  describe('challengeUrlResolver', () => {
    it('resolves to the first challenge url by default', async () => {
      const challengeUrlResolver = await (0, _challenge.createChallengeUrlResolver)(_fixtures.mockAllChallenges, {
        _getFirstChallenge: _fixtures.mockGetFirstChallenge
      });
      return challengeUrlResolver().then(url => {
        expect(url).toEqual(_fixtures.firstChallengeUrl);
      });
    }, 10000);

    // eslint-disable-next-line max-len
    it('returns the first challenge url if the provided id does not relate to a challenge', async () => {
      const challengeUrlResolver = await (0, _challenge.createChallengeUrlResolver)(_fixtures.mockAllChallenges, {
        _getFirstChallenge: _fixtures.mockGetFirstChallenge
      });
      return challengeUrlResolver('not-a-real-challenge').then(url => {
        expect(url).toEqual(_fixtures.firstChallengeUrl);
      });
    });
    it('resolves the correct url for the requested challenge', async () => {
      const challengeUrlResolver = await (0, _challenge.createChallengeUrlResolver)(_fixtures.mockAllChallenges, {
        _getFirstChallenge: _fixtures.mockGetFirstChallenge
      });
      return challengeUrlResolver('123abc').then(url => {
        expect(url).toEqual(_fixtures.requestedChallengeUrl);
      });
    });
  });
  describe('getFirstChallenge', () => {
    it('returns the correct challenge url from the model', async () => {
      const result = await (0, _challenge.getFirstChallenge)(_fixtures.mockAllChallenges);
      expect(result).toEqual(_fixtures.firstChallengeUrl);
    });
    it('returns the learn base if no challenges found', async () => {
      const result = await (0, _challenge.getFirstChallenge)([]);
      expect(result).toEqual('/learn');
    });
  });
  describe('isValidChallengeCompletion', () => {
    const validObjectId = '5c716d1801013c3ce3aa23e6';
    it('declares a 403 for an invalid id in the body', () => {
      expect.assertions(2);
      const req = mockReq({
        body: {
          id: 'not-a-real-id'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    it('declares a 403 for an invalid challengeType in the body', () => {
      expect.assertions(2);
      const req = mockReq({
        body: {
          id: validObjectId,
          challengeType: 'ponyfoo'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    it('declares a 403 for an invalid solution in the body', () => {
      expect.assertions(2);
      const req = mockReq({
        body: {
          id: validObjectId,
          challengeType: '1',
          solution: 'https://not-a-url'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    it('calls next if the body is valid', () => {
      const req = mockReq({
        body: {
          id: validObjectId,
          challengeType: '1',
          solution: 'https://www.freecodecamp.org'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('calls next if only the id is provided', () => {
      const req = mockReq({
        body: {
          id: validObjectId
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('can handle an "int" challengeType', () => {
      const req = mockReq({
        body: {
          id: validObjectId,
          challengeType: 1
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _challenge.isValidChallengeCompletion)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
  xdescribe('modernChallengeCompleted', () => {});
  xdescribe('projectCompleted', () => {});
  describe('redirectToCurrentChallenge', () => {
    const mockHomeLocation = 'https://www.example.com';
    const mockLearnUrl = `${mockHomeLocation}/learn`;
    const mockgetParamsFromReq = () => ({
      returnTo: mockLearnUrl,
      origin: mockHomeLocation,
      pathPrefix: ''
    });
    const mockNormalizeParams = params => params;
    it('redirects to the learn base url for non-users', async () => {
      const redirectToCurrentChallenge = (0, _challenge.createRedirectToCurrentChallenge)(() => {}, mockNormalizeParams, mockgetParamsFromReq);
      const req = mockReq();
      const res = mockRes();
      const next = jest.fn();
      await redirectToCurrentChallenge(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith(mockLearnUrl);
    });

    // eslint-disable-next-line max-len
    it('redirects to the url provided by the challengeUrlResolver', async () => {
      const challengeUrlResolver = await (0, _challenge.createChallengeUrlResolver)(_fixtures.mockAllChallenges, {
        _getFirstChallenge: _fixtures.mockGetFirstChallenge
      });
      const expectedUrl = `${mockHomeLocation}${_fixtures.requestedChallengeUrl}`;
      const redirectToCurrentChallenge = (0, _challenge.createRedirectToCurrentChallenge)(challengeUrlResolver, mockNormalizeParams, mockgetParamsFromReq);
      const req = mockReq({
        user: _fixtures.mockUser
      });
      const res = mockRes();
      const next = jest.fn();
      await redirectToCurrentChallenge(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith(expectedUrl);
    });

    // eslint-disable-next-line max-len
    it('redirects to the first challenge for users without a currentChallengeId', async () => {
      const challengeUrlResolver = await (0, _challenge.createChallengeUrlResolver)(_fixtures.mockAllChallenges, {
        _getFirstChallenge: _fixtures.mockGetFirstChallenge
      });
      const redirectToCurrentChallenge = (0, _challenge.createRedirectToCurrentChallenge)(challengeUrlResolver, mockNormalizeParams, mockgetParamsFromReq);
      const req = mockReq({
        user: _objectSpread(_objectSpread({}, _fixtures.mockUser), {}, {
          currentChallengeId: ''
        })
      });
      const res = mockRes();
      const next = jest.fn();
      await redirectToCurrentChallenge(req, res, next);
      const expectedUrl = `${mockHomeLocation}${_fixtures.firstChallengeUrl}`;
      expect(res.redirect).toHaveBeenCalledWith(expectedUrl);
    });
  });
});