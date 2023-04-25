"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bootStatus;
var _createHandledError = require("../utils/create-handled-error");
function bootStatus(app) {
  const api = app.loopback.Router();

  // DEBUG ROUTE
  api.get('/sentry/error', () => {
    throw Error('debugging sentry');
  });
  api.get('/sentry/wrapped', () => {
    throw (0, _createHandledError.wrapHandledError)(Error('debugging sentry, wrapped'), {
      type: 'info',
      message: 'debugmessage',
      redirectTo: `a/page`
    });
  });
  app.use(api);
}