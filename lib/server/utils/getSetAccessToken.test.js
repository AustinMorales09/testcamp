"use strict";

var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _challenge = require("../boot_tests/challenge.test");
var _getSetAccessToken = require("./getSetAccessToken");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
describe('getSetAccessToken', () => {
  const validJWTSecret = 'this is a super secret string';
  const invalidJWTSecret = 'This is not correct secret';
  const now = new Date(Date.now());
  const theBeginningOfTime = new Date(0);
  const domain = 'www.example.com';
  const accessToken = {
    id: '123abc',
    userId: '456def',
    ttl: 60000,
    created: now
  };

  // https://stackoverflow.com/questions/48033841/test-process-env-with-jest
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules(); // process is implicitly cached by Jest, so hence the reset
    process.env = _objectSpread({}, OLD_ENV); // Shallow clone that we can modify
    process.env.COOKIE_DOMAIN = domain;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });
  describe('getAccessTokenFromRequest', () => {
    it('return `no token` error if no token is found', () => {
      const req = (0, _challenge.mockReq)({
        headers: {},
        cookie: {}
      });
      const result = (0, _getSetAccessToken.getAccessTokenFromRequest)(req, validJWTSecret);
      expect(result.error).toEqual(_getSetAccessToken.errorTypes.noTokenFound);
    });
    describe('cookies', () => {
      it('returns `invalid token` error for malformed tokens', () => {
        const invalidJWT = _jsonwebtoken.default.sign({
          accessToken
        }, invalidJWTSecret);
        // eslint-disable-next-line camelcase
        const req = (0, _challenge.mockReq)({
          cookie: {
            jwt_access_token: invalidJWT
          }
        });
        const result = (0, _getSetAccessToken.getAccessTokenFromRequest)(req, validJWTSecret);
        expect(result.error).toEqual(_getSetAccessToken.errorTypes.invalidToken);
      });
      it('returns `expired token` error for expired tokens', () => {
        const invalidJWT = _jsonwebtoken.default.sign({
          accessToken: _objectSpread(_objectSpread({}, accessToken), {}, {
            created: theBeginningOfTime
          })
        }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = (0, _challenge.mockReq)({
          cookie: {
            jwt_access_token: invalidJWT
          }
        });
        const result = (0, _getSetAccessToken.getAccessTokenFromRequest)(req, validJWTSecret);
        expect(result.error).toEqual(_getSetAccessToken.errorTypes.expiredToken);
      });
      it('returns a valid access token with no errors ', () => {
        expect.assertions(2);
        const validJWT = _jsonwebtoken.default.sign({
          accessToken
        }, validJWTSecret);
        // eslint-disable-next-line camelcase
        const req = (0, _challenge.mockReq)({
          cookie: {
            jwt_access_token: validJWT
          }
        });
        const result = (0, _getSetAccessToken.getAccessTokenFromRequest)(req, validJWTSecret);
        expect(result.error).toBeFalsy();
        expect(result.accessToken).toEqual(_objectSpread(_objectSpread({}, accessToken), {}, {
          created: accessToken.created.toISOString()
        }));
      });
    });
  });
  describe('setAccessTokenToResponse', () => {
    it('sets a jwt access token cookie in the response', () => {
      const req = (0, _challenge.mockReq)();
      const res = (0, _challenge.mockRes)();
      const expectedJWT = _jsonwebtoken.default.sign({
        accessToken
      }, validJWTSecret);
      (0, _getSetAccessToken.setAccessTokenToResponse)({
        accessToken
      }, req, res, validJWTSecret);
      expect(res.cookie).toHaveBeenNthCalledWith(1, 'jwt_access_token', expectedJWT, {
        signed: false,
        domain,
        maxAge: accessToken.ttl
      });
    });
  });
  describe('removeCookies', () => {
    // eslint-disable-next-line max-len
    it('removes four cookies set in the lifetime of an authenticated session', () => {
      // expect.assertions(4);
      const req = (0, _challenge.mockReq)();
      const res = (0, _challenge.mockRes)();
      const jwtOptions = {
        signed: false,
        domain
      };
      (0, _getSetAccessToken.removeCookies)(req, res);
      expect(res.clearCookie).toHaveBeenNthCalledWith(1, 'jwt_access_token', jwtOptions);
      expect(res.clearCookie).toHaveBeenNthCalledWith(2, 'access_token', jwtOptions);
      expect(res.clearCookie).toHaveBeenNthCalledWith(3, 'userId', jwtOptions);
      expect(res.clearCookie).toHaveBeenNthCalledWith(4, '_csrf', jwtOptions);
    });
  });
});