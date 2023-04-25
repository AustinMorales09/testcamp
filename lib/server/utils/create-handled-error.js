"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createValidatorErrorFormatter = void 0;
exports.isHandledError = isHandledError;
exports.unwrapHandledError = unwrapHandledError;
exports.wrapHandledError = wrapHandledError;
const _handledError = Symbol('handledError');
function isHandledError(err) {
  return !!err[_handledError];
}
function unwrapHandledError(err) {
  return err[_handledError] || {};
}
function wrapHandledError(err, {
  type,
  message,
  redirectTo,
  status = 200
}) {
  err[_handledError] = {
    type,
    message,
    redirectTo,
    status
  };
  return err;
}

// for use with express-validator error formatter
const createValidatorErrorFormatter = (type, redirectTo) => ({
  msg
}) => wrapHandledError(new Error(msg), {
  type,
  message: msg,
  redirectTo,
  // we default to 400 as these are malformed requests
  status: 400
});
exports.createValidatorErrorFormatter = createValidatorErrorFormatter;