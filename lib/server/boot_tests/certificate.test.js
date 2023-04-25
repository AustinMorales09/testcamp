"use strict";

var _certificate = require("../boot/certificate");
var _fixtures = require("./fixtures");
describe('boot/certificate', () => {
  describe('getFallbackFullStackDate', () => {
    it('should return the date of the latest completed challenge', () => {
      expect((0, _certificate.getFallbackFullStackDate)(_fixtures.fullStackChallenges)).toBe(1685210952511);
    });
  });
});