"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createCookieConfig = createCookieConfig;
function createCookieConfig(req) {
  return {
    signed: !!req.signedCookies,
    domain: process.env.COOKIE_DOMAIN || 'localhost'
  };
}