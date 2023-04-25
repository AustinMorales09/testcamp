"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.errorThrowerMiddleware = void 0;
const errorThrowerMiddleware = () => next => action => {
  if (action.error) {
    throw action.payload;
  }
  return next(action);
};
exports.errorThrowerMiddleware = errorThrowerMiddleware;