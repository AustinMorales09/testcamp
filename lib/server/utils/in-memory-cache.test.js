"use strict";

var _inMemoryCache = _interopRequireDefault(require("./in-memory-cache"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
describe('InMemoryCache', () => {
  let reportErrorStub;
  const theAnswer = 42;
  const before = 'before';
  const after = 'after';
  const emptyCacheValue = null;
  beforeEach(() => {
    reportErrorStub = jest.fn();
  });
  it('throws if no report function is passed as a second argument', () => {
    expect(() => (0, _inMemoryCache.default)(null)).toThrowError('No reportError function specified for this in-memory-cache');
  });
  describe('get', () => {
    it('returns an initial value', () => {
      const cache = (0, _inMemoryCache.default)(theAnswer, reportErrorStub);
      expect(cache.get()).toBe(theAnswer);
    });
  });
  describe('update', () => {
    it('updates the cached value', () => {
      const cache = (0, _inMemoryCache.default)(before, reportErrorStub);
      cache.update(() => after);
      expect(cache.get()).toBe(after);
    });
    it('can handle promises correctly', done => {
      const cache = (0, _inMemoryCache.default)(before, reportErrorStub);
      const promisedUpdate = () => new Promise(resolve => resolve(after));
      cache.update(promisedUpdate).then(() => {
        expect(cache.get()).toBe(after);
        done();
      });
    });
    it('reports errors thrown from the update function', () => {
      const cache = (0, _inMemoryCache.default)(before, reportErrorStub);
      const updateError = new Error('An update error');
      const updateThatThrows = () => {
        throw updateError;
      };
      cache.update(updateThatThrows);
      expect(reportErrorStub).toHaveBeenCalledWith(updateError);
    });
  });
  describe('clear', () => {
    it('clears the  cache', () => {
      expect.assertions(2);
      const cache = (0, _inMemoryCache.default)(theAnswer, reportErrorStub);
      expect(cache.get()).toBe(theAnswer);
      cache.clear();
      expect(cache.get()).toBe(emptyCacheValue);
    });
  });
});