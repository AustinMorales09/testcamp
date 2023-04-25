"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockRes = exports.mockReq = void 0;
var _lodash = require("lodash");
var _challenge = require("../boot/challenge");
var _fixtures = require("./fixtures");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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