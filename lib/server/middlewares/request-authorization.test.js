"use strict";

var _path = _interopRequireDefault(require("path"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _dotenv = require("dotenv");
var _challenge = require("../boot_tests/challenge.test");
var _requestAuthorization = _interopRequireWildcard(require("./request-authorization"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
(0, _dotenv.config)({
  path: _path.default.resolve(__dirname, '../../../../.env')
});
const validJWTSecret = 'this is a super secret string';
const invalidJWTSecret = 'This is not correct secret';
const now = new Date(Date.now());
const theBeginningOfTime = new Date(0);
const accessToken = {
  id: '123abc',
  userId: '456def',
  ttl: 60000,
  created: now
};
const users = {
  '456def': {
    username: 'camperbot',
    progressTimestamps: [1, 2, 3, 4]
  }
};
const mockGetUserById = id => id in users ? Promise.resolve(users[id]) : Promise.reject('No user found');
const mockReq = args => {
  const mock = (0, _challenge.mockReq)(args);
  mock.header = () => process.env.HOME_LOCATION;
  return mock;
};
describe('request-authorization', () => {
  describe('isAllowedPath', () => {
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
    const allowedPathsList = [authRE, confirmEmailRE, newsShortLinksRE, publicUserRE, publicUsernameRE, resubscribeRE, showCertRE, signinRE, statusRE, unsubscribedRE, unsubscribeRE];
    it('returns a boolean', () => {
      const result = (0, _requestAuthorization.isAllowedPath)();
      expect(typeof result).toBe('boolean');
    });
    it('returns true for a white listed path', () => {
      const resultA = (0, _requestAuthorization.isAllowedPath)('/auth/auth0/callback?code=yF_mGjswLsef-_RLo', allowedPathsList);
      const resultB = (0, _requestAuthorization.isAllowedPath)('/ue/WmjInLerysPrcon6fMb/', allowedPathsList);
      expect(resultA).toBe(true);
      expect(resultB).toBe(true);
    });
    it('returns false for a non-white-listed path', () => {
      const resultA = (0, _requestAuthorization.isAllowedPath)('/hax0r-42/no-go', allowedPathsList);
      const resultB = (0, _requestAuthorization.isAllowedPath)('/update-current-challenge', allowedPathsList);
      expect(resultA).toBe(false);
      expect(resultB).toBe(false);
    });
  });
  describe('createRequestAuthorization', () => {
    const requestAuthorization = (0, _requestAuthorization.default)({
      jwtSecret: validJWTSecret,
      getUserById: mockGetUserById
    });
    it('is a function', () => {
      expect(typeof requestAuthorization).toEqual('function');
    });
    describe('cookies', () => {
      it('throws when no access token is present', () => {
        expect.assertions(2);
        const req = mockReq({
          path: '/some-path/that-needs/auth'
        });
        const res = (0, _challenge.mockRes)();
        const next = jest.fn();
        expect(() => requestAuthorization(req, res, next)).toThrowError('Access token is required for this request');
        expect(next).not.toHaveBeenCalled();
      });
      it('throws when the access token is invalid', () => {
        expect.assertions(2);
        const invalidJWT = _jsonwebtoken.default.sign({
          accessToken
        }, invalidJWTSecret);
        const req = mockReq({
          path: '/some-path/that-needs/auth',
          // eslint-disable-next-line camelcase
          cookie: {
            jwt_access_token: invalidJWT
          }
        });
        const res = (0, _challenge.mockRes)();
        const next = jest.fn();
        expect(() => requestAuthorization(req, res, next)).toThrowError('Access token is invalid');
        expect(next).not.toHaveBeenCalled();
      });
      it('throws when the access token has expired', () => {
        expect.assertions(2);
        const invalidJWT = _jsonwebtoken.default.sign({
          accessToken: _objectSpread(_objectSpread({}, accessToken), {}, {
            created: theBeginningOfTime
          })
        }, validJWTSecret);
        const req = mockReq({
          path: '/some-path/that-needs/auth',
          // eslint-disable-next-line camelcase
          cookie: {
            jwt_access_token: invalidJWT
          }
        });
        const res = (0, _challenge.mockRes)();
        const next = jest.fn();
        expect(() => requestAuthorization(req, res, next)).toThrowError('Access token is no longer valid');
        expect(next).not.toHaveBeenCalled();
      });
      it('adds the user to the request object', async () => {
        expect.assertions(3);
        const validJWT = _jsonwebtoken.default.sign({
          accessToken
        }, validJWTSecret);
        const req = mockReq({
          path: '/some-path/that-needs/auth',
          // eslint-disable-next-line camelcase
          cookie: {
            jwt_access_token: validJWT
          }
        });
        const res = (0, _challenge.mockRes)();
        const next = jest.fn();
        await requestAuthorization(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req).toHaveProperty('user');
        expect(req.user).toEqual(users['456def']);
      });
      it('calls next if request does not require authorization', async () => {
        // currently /unsubscribe does not require authorization
        const req = mockReq({
          path: '/unsubscribe/another/route'
        });
        const res = (0, _challenge.mockRes)();
        const next = jest.fn();
        await requestAuthorization(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });
});