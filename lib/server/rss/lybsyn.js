"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getLybsynFeed = getLybsynFeed;
var _http = _interopRequireDefault(require("http"));
var _lodash = _interopRequireDefault(require("lodash"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const lybsynFeed = 'http://freecodecamp.libsyn.com/render-type/json';
function getLybsynFeed() {
  return new Promise((resolve, reject) => {
    _http.default.get(lybsynFeed, res => {
      let raw = '';
      res.on('data', chunk => {
        raw += chunk;
      });
      res.on('error', err => reject(err));
      res.on('end', () => {
        let feed = [];
        try {
          feed = JSON.parse(raw);
        } catch (err) {
          return reject(err);
        }
        const items = feed.map(item => _lodash.default.pick(item, ['full_item_url', 'item_title', 'release_date', 'item_body_short']))
        /* eslint-disable camelcase */.map(({
          full_item_url,
          item_title,
          release_date,
          item_body_short
        }) => ({
          title: item_title,
          extract: item_body_short,
          isoDate: new Date(release_date).toISOString(),
          link: full_item_url
        }));
        /* eslint-enable camelcase */
        return resolve(items);
      });
    });
  });
}