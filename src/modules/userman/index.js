// Created by snov on 14.07.2016.
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('./model');
var userSchema = User.schema;

import routes from './routes';

import { isArray } from '../../lib/core';

const routeActions = {
  newUserRegistered: [],
  userLoggedIn: []
};

function getDestinationForEvent (event) {
  if (!routeActions[event])
    routeActions[event] = [];

  return routeActions[event];
}

function addPlugin (plugin) {
  if (!plugin.target || !plugin.func) {
    console.log(plugin.target, plugin.func, 'ERROR~!!!!');
    return;
  }

  if (plugin.target === 'schema') {
    userSchema.plugin(plugin.func);
  } else if (plugin.target === 'express') {
    const dst = getDestinationForEvent(plugin.event);
    if (!dst) {
      console.log('addPlugin() error. Wrong plugin.event:', plugin.event);
      return;
    }

    dst.push(plugin.func);
  }
}

function pluginsProcessor(plugins) {
  console.log('plugins: ', plugins);

  if (isArray(plugins)) {
    for (let i = 0; i < plugins.length; i++) {
      addPlugin(plugins[i])
    }
  }
}

export default function userMan(osnova, opts) {
  const app = osnova.express;

  pluginsProcessor(opts.plugins);

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      process.nextTick(function() {
        User.findOne({ 'local.email' :  email }, function(err, user) {
          if (err) { return done(err); }
          if (user) { return done(null, false); }

          var newUser            = new User();

          newUser.local.email    = email;
          newUser.local.password = newUser.generateHash(password);

          newUser.save(function(err) {
            if (err) throw err;
            return done(null, newUser);
          });
        });
      });
  }));

  passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form
      User.findOneAsync({ 'local.email' :  email })
      .then(function (user, err) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.validPassword(password)) { return done(null, false); }
        return done(null, user);
      })
  }));

  osnova.userman = {
    passport: passport,
    user: User,
    events: routeActions
  };

  osnova.execute(routes, [{
    events: routeActions
  }]);
}