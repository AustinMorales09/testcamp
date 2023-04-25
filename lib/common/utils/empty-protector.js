"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = protect;
const emptyProtector = {
  blocks: [],
  challenges: []
};
// protect against malformed map data
// protect(block: { challenges: [], block: [] }|Void) => block|emptyProtector
function protect(block) {
  // if no block or block has no challenges or blocks
  if (!block || !(block.challenges || block.blocks)) {
    return emptyProtector;
  }
  return block;
}