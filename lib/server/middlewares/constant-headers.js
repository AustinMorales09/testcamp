"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = constantHeaders;
var _corsSettings = require("../../../configs/cors-settings");
var _env = require("../../../configs/env.json");
function constantHeaders() {
  return function (req, res, next) {
    if (req.headers && req.headers.origin && _corsSettings.allowedOrigins.includes(req.headers.origin)) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
    } else {
      res.header('Access-Control-Allow-Origin', _env.homeLocation);
    }
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  };
}