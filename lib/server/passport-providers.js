"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _env = require("../../../config/env.json");
var _secrets = require("../../../config/secrets");
const {
  clientID,
  clientSecret,
  domain
} = _secrets.auth0;

// These don't seem to be used, can they go?
const successRedirect = `${_env.homeLocation}/learn`;
const failureRedirect = `${_env.homeLocation}/signin`;

// TODO: can we remove passport-mock-strategy entirely in prod? That would let
// us make passport-mock-strategy a dev dep, as it should be.
const passportProviders = {
  devlogin: {
    authScheme: 'mock',
    provider: 'dev',
    module: 'passport-mock-strategy'
  },
  local: {
    provider: 'local',
    module: 'passport-local',
    usernameField: 'email',
    passwordField: 'password',
    authPath: '/auth/local',
    successRedirect: successRedirect,
    failureRedirect: failureRedirect,
    session: true,
    failureFlash: true
  },
  'auth0-login': {
    provider: 'auth0',
    module: 'passport-auth0',
    clientID,
    clientSecret,
    domain,
    cookieDomain: process.env.COOKIE_DOMAIN || 'localhost',
    callbackURL: `${_env.apiLocation}/auth/auth0/callback`,
    authPath: '/auth/auth0',
    callbackPath: '/auth/auth0/callback',
    useCustomCallback: true,
    passReqToCallback: true,
    state: false,
    successRedirect: successRedirect,
    failureRedirect: failureRedirect,
    scope: ['openid profile email'],
    failureFlash: true
  }
};
var _default = passportProviders;
exports.default = _default;