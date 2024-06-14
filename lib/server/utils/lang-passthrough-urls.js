"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = exports.default = ['auth', 'services', 'link'].reduce((throughs, route) => {
  throughs[route] = true;
  return throughs;
}, {});