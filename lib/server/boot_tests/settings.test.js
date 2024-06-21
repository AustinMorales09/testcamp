"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockRes = exports.mockReq = void 0;
var _settings = require("../boot/settings");
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
describe('boot/settings', () => {
  describe('updateMySocials', () => {
    it('does not allow non-github domain in GitHub social', () => {
      const req = mockReq({
        user: {},
        body: {
          githubProfile: 'https://www.almost-github.com'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('does not allow non-linkedin domain in LinkedIn social', () => {
      const req = mockReq({
        user: {},
        body: {
          linkedin: 'https://www.freecodecamp.org'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('does not allow non-twitter domain in Twitter social', () => {
      const req = mockReq({
        user: {},
        body: {
          twitter: 'https://www.freecodecamp.org'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('allows empty string in any social', () => {
      const req = mockReq({
        user: {
          updateAttributes: (_, cb) => cb()
        },
        body: {
          twitter: '',
          linkedin: '',
          githubProfile: '',
          website: ''
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('allows any valid link in website social', () => {
      const req = mockReq({
        user: {
          updateAttributes: (_, cb) => cb()
        },
        body: {
          website: 'https://www.freecodecamp.org'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it('allows valid links with sub-domains to pass', () => {
      const req = mockReq({
        user: {
          updateAttributes: (_, cb) => cb()
        },
        body: {
          githubProfile: 'https://www.gist.github.com',
          linkedin: 'https://www.linkedin.com/freecodecamp',
          twitter: 'https://www.twitter.com/freecodecamp',
          website: 'https://www.example.freecodecamp.org'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMySocials)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
  describe('updateMyClassroomMode', () => {
    it('does not allow invalid classroomMode', () => {
      const req = mockReq({
        user: {},
        body: {
          isClassroomAccount: 'invalid'
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMyClassroomMode)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
    it('allows valid classroomMode', () => {
      const req = mockReq({
        user: {
          updateAttributes: (_, cb) => cb()
        },
        body: {
          isClassroomAccount: true
        }
      });
      const res = mockRes();
      const next = jest.fn();
      (0, _settings.updateMyClassroomMode)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});