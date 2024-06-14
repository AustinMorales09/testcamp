"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sessionsMiddleware;
var _connectMongo = _interopRequireDefault(require("connect-mongo"));
var _expressSession = _interopRequireDefault(require("express-session"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MongoStore = (0, _connectMongo.default)(_expressSession.default);
const sessionSecret = process.env.SESSION_SECRET;
const url = 'mongodb+srv://amorales:Kable123!@cluster0.gm6pm.mongodb.net/testdirectConnection=true' || process.env.MONGOHQ_URL;
function sessionsMiddleware() {
  return (0, _expressSession.default)({
    // 900 day session cookie
    cookie: {
      maxAge: 900 * 24 * 60 * 60 * 1000
    },
    // resave forces session to be resaved
    // regardless of whether it was modified
    // this causes race conditions during parallel req
    resave: false,
    saveUninitialized: true,
    secret: sessionSecret,
    store: new MongoStore({
      url
    })
  });
}