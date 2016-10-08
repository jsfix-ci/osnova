// Created by snov on 07.10.2016.

import Communicator from './core';

function communicator(osnova) {
  osnova.communicator = new Communicator({
    master: osnova.opts.master,
    port: 4778,
    ip: osnova.config.target.host.ip,
    io: osnova.io || null
  });
}

module.exports = communicator;