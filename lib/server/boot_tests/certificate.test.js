"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockRes = exports.mockReq = void 0;
var _certificate = require("../boot/certificate");
var _fixtures = require("./fixtures");
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
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
  res.end = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return _objectSpread(_objectSpread({}, res), opts);
};
exports.mockRes = mockRes;
describe('boot/certificate', () => {
  describe('getFallbackFullStackDate', () => {
    it('should return the date of the latest completed challenge', () => {
      expect((0, _certificate.getFallbackFullStackDate)(_fixtures.fullStackChallenges)).toBe(1685210952511);
    });
  });
  describe('ifNoCertification404', () => {
    it('declares a 404 when there is no certSlug in the body', () => {
      const req = mockReq({
        body: {}
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _certificate.ifNoCertification404)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });
    it('declares a 404 for an invalid certSlug in the body', () => {
      const req = mockReq({
        body: {
          certSlug: 'not-a-real-certSlug'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _certificate.ifNoCertification404)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(next).not.toHaveBeenCalled();
    });
    it('calls next for a valid certSlug of a current certification', () => {
      const req = mockReq({
        body: {
          certSlug: 'responsive-web-design'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _certificate.ifNoCertification404)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('calls next for a valid certSlug of a legacy certification', () => {
      const req = mockReq({
        body: {
          certSlug: 'legacy-front-end'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _certificate.ifNoCertification404)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
    it('calls next for a valid certSlug of the legacy full stack certification', () => {
      const req = mockReq({
        body: {
          certSlug: 'full-stack'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _certificate.ifNoCertification404)(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});