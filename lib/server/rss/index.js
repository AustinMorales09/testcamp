"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _compare_desc = _interopRequireDefault(require("date-fns/compare_desc"));
var _debug = _interopRequireDefault(require("debug"));
var _lodash = _interopRequireDefault(require("lodash"));
var _lybsyn = require("./lybsyn");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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