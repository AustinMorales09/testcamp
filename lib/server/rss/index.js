"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _compare_desc = _interopRequireDefault(require("date-fns/compare_desc"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _lybsyn = require("./lybsyn");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
const log = (0, _debug.default)('fcc:rss:news-feed');
const fiveMinutes = 1000 * 60 * 5;
class NewsFeed {
  constructor() {
    _defineProperty(this, "setState", stateUpdater => {
      const newState = stateUpdater(this.state);
      this.state = _lodash.default.merge({}, this.state, newState);
      return;
    });
    _defineProperty(this, "refreshFeeds", () => {
      const currentFeed = this.state.combinedFeed.slice(0);
      log('grabbing feeds');
      return Promise.all([(0, _lybsyn.getLybsynFeed)()]).then(([lybsynFeed]) => this.setState(state => _objectSpread(_objectSpread({}, state), {}, {
        lybsynFeed
      }))).then(() => {
        log('crossing the streams');
        const {
          lybsynFeed
        } = this.state;
        const combinedFeed = [...lybsynFeed].sort((a, b) => {
          return (0, _compare_desc.default)(a.isoDate, b.isoDate);
        });
        this.setState(state => _objectSpread(_objectSpread({}, state), {}, {
          combinedFeed,
          readyState: true
        }));
      }).catch(err => {
        console.log(err);
        this.setState(state => _objectSpread(_objectSpread({}, state), {}, {
          combinedFeed: currentFeed
        }));
      });
    });
    _defineProperty(this, "getFeed", () => new Promise(resolve => {
      let notReadyCount = 0;
      function waitForReady() {
        log('notReadyCount', notReadyCount);
        notReadyCount++;
        return this.state.readyState || notReadyCount === 5 ? resolve(this.state.combinedFeed) : setTimeout(waitForReady, 100);
      }
      log('are we ready?', this.state.readyState);
      return this.state.readyState ? resolve(this.state.combinedFeed) : setTimeout(waitForReady, 100);
    }));
    this.state = {
      readyState: false,
      lybsynFeed: [],
      combinedFeed: []
    };
    this.refreshFeeds();
    setInterval(this.refreshFeeds, fiveMinutes);
  }
}
var _default = exports.default = NewsFeed;