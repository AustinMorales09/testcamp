"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fourOhFour;
var _accepts = _interopRequireDefault(require("accepts"));
var _redirection = require("../utils/redirection");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function fourOhFour(app) {
  app.all('*', function (req, res) {
    const accept = (0, _accepts.default)(req);
    // prioritise returning json
    const type = accept.type('json', 'html', 'text');
    const {
      path
    } = req;
    const {
      origin
    } = (0, _redirection.getRedirectParams)(req);
    if (type === 'json') {
      return res.status('404').json({
        error: 'path not found'
      });
    } else {
      req.flash('danger', `We couldn't find path ${path}`);
      return res.redirectWithFlash(`${origin}/404`);
    }
  });
}