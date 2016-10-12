'use strict';

var _core = require('./core');

var _core2 = _interopRequireDefault(_core);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_NAME = 'communicator'; // Created by snov on 07.10.2016.

function communicator(osnova) {
  osnova.communicator = new _core2.default({
    master: osnova.opts.master,
    port: 4778,
    ip: 'localhost',
    io: osnova.io || null
  });
  osnova.moduleReady();
}

module.exports = {
  name: MODULE_NAME,
  fn: communicator
};