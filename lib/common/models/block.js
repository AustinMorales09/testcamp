"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initializeBlock;
var _rx = require("rx");
function initializeBlock(Block) {
  Block.on('dataSourceAttached', () => {
    Block.findOne$ = _rx.Observable.fromNodeCallback(Block.findOne, Block);
    Block.findById$ = _rx.Observable.fromNodeCallback(Block.findById, Block);
    Block.find$ = _rx.Observable.fromNodeCallback(Block.find, Block);
  });
}