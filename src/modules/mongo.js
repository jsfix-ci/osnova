// Created by snov on 11.10.2016.

const mongoose = require('mongoose');
const Bluebird = require('bluebird');

mongoose.Promise = Bluebird;
Bluebird.promisifyAll(mongoose);

let isFirstTimeConnected = true;

function connect(osnova) {
  const config = osnova.opts.core.database;
  let connectString;
  if (config.uri) {
    connectString = config.uri;
  } else {
    connectString = config.path + config.name;
  }
  return (
    /* TODO: JSFIX could not patch the breaking change:
    BREAKING CHANGE: mongoose.connect() returns a promise, removed MongooseThenable #5796
    Suggested fix: Only relevant if you depend on the return value being a reference to the mongoose object. In that case, you need to modify the usages of the return value to get the mongoose object from somewhere else.*/
    mongoose.connect(connectString).connection
  );
}

const mongo = opts => osnova => {
  let connection = connect(osnova);

  connection
    .on('error', () => { console.error(`Can't connect to ${osnova.opts.core.database.uri}.`); })
    .on('disconnected', () => { connection = connect(osnova); })
    .once('open', () => {
      console.log('Connected to MongoDB.');
      if (isFirstTimeConnected) {
        isFirstTimeConnected = false;
        osnova.next({
          mongo: {
            connection
          }
        });
      }
    });
};

module.exports = mongo;
export default mongo;