'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Server = undefined;
exports.default = OSNOVA_DEFAULT;

var _osnovaLib = require('osnova-lib');

// Created by snov on 29.06.2016.

var path = require('path');
var EventEmitter = require('events').EventEmitter;

var consoleLinesBigSeparator = '----------------------------------------';

var getHelloLines = function getHelloLines(name, version) {
  return [consoleLinesBigSeparator, 'Welcome to ' + name + ' v' + version, consoleLinesBigSeparator];
};

var printHello = function printHello(name, version) {
  var helloLines = getHelloLines(name, version);
  for (var i = 0; i < helloLines.length; i++) {
    console.log(helloLines[i]);
  }
};

var defaultListen = function defaultListen(opts) {
  return function (http) {
    var port = opts.port,
        ip = opts.ip;


    http.listen(port, ip, function () {
      console.log('Default http server started on ' + ip + ':' + port);
    });
  };
};

var addCoreModule = function addCoreModule(osnova, moduleName) {
  var usageOpts = osnova.opts.core.modules[moduleName];
  var isUsageObject = (0, _osnovaLib.isObject)(usageOpts);

  if (isUsageObject && usageOpts.use == true || usageOpts == true) {
    var modulePath = './modules/' + moduleName;
    var opts = isUsageObject ? usageOpts.opts : null;

    osnova.add(require(modulePath)(opts), moduleName);
  }
};

var OSNOVA = function OSNOVA() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  this.__version = require('../package.json').version;

  opts.core = (0, _osnovaLib.defaults)(opts.core, require('./config/core'));
  opts.core.paths.absolute.assets = path.resolve(opts.core.paths.absolute.root, opts.core.paths.assets);

  this.opts = opts;

  if (opts.listen === 'default') {
    opts.listen = defaultListen(opts.core.host);
  }

  this.listen = opts.listen;

  // module loading stuff
  this.moduleQueue = [];

  // used to generate names of unnamed modules
  this.moduleLastIndex = 0;
  // if true modules will be loaded one by one.
  // next module will be activated when MODULE_READY event is fired.
  this.syncModuleLoading = true;
  this.currentModule = null;
  this.firstModule = null;

  this.ee = new EventEmitter();
  this.ee.on('MODULE_READY', this.onModuleReady.bind(this));
  this.ee.on('ALL_MODULES_READY', this.onAllModulesReady.bind(this));

  // process built-in core modules
  addCoreModule(this, 'mongo');
  addCoreModule(this, 'express');
  addCoreModule(this, 'session');
  addCoreModule(this, 'socketio');
  addCoreModule(this, 'communicator');

  // process modules from options
  var modules = opts.modules;

  if ((0, _osnovaLib.isArray)(modules)) {
    for (var i = 0; i < modules.length; i++) {
      this.add(modules[i]);
    }
  }
};

OSNOVA.prototype = Object.create(null);
OSNOVA.prototype.constructor = OSNOVA;

// add module to the queue
// if the queue is empty - this is first module and the current
// if current module is exist - add new module as next to current
// and set new module is current
// so we have single linked list of modules in order of they were added
OSNOVA.prototype.add = function (module, name) {
  if ((0, _osnovaLib.isFunction)(module)) {
    module = {
      fn: module,
      name: name || 'm' + this.moduleLastIndex++
    };
  } else if ((0, _osnovaLib.isObject)(module) && (0, _osnovaLib.isFunction)(module.fn)) {
    if (!module.name) {
      module.name = name || 'm' + this.moduleLastIndex;
    }
  } else {
    console.log('Error: wrong module format ' + module);
    return;
  }

  if (this.moduleQueue[module.name]) {
    console.log('Warning: module with name [' + module.name + '] already present in modules\' queue. Overriding.');
  }

  this.moduleQueue[module.name] = module;

  if (this.currentModule) {
    this.currentModule.nextModule = module;
  } else {
    this.firstModule = module;
  }
  this.currentModule = module;
};

OSNOVA.prototype.onAllModulesReady = function () {
  console.log('All modules are ready. Booting...');

  if ((0, _osnovaLib.isFunction)(this.listen)) {
    this.listen(this.http);
  } else {
    console.log('No listen function was specified. Are you sure that\'s everything all right?');
  }
};

function executeModule(osnova, module) {
  console.log('Executing module ' + module.name);
  module.fn(osnova);
}

// Triggered by moduleReady()
OSNOVA.prototype.onModuleReady = function (result) {
  var module = this.currentModule;

  if (!module) return;

  console.log('Module ' + module.name + ' is ready');

  // copy result of module work to OSNOVA
  if (result !== undefined && result !== null) {
    Object.assign(this, result);
  }

  // since current module is ready - move to the next one
  this.currentModule = module.nextModule;
  delete this.moduleQueue[module.name];

  // if there is no current module - it means we are in the end of the queue
  // and all modules are ready, otherwise - execute next.
  if (!this.currentModule) {
    this.ee.emit('ALL_MODULES_READY');
  } else {
    executeModule(this, this.currentModule);
  }
};

// Must be called when OSNOVA Module has done all his thing and ready to go.
// If some module won't call this function - module loading process will stuck on this module forever.
// Since modules are executed in a sequence - if this function is called inside the module code - this module
// is currentModule and we don't need to know it's name to say to system what module is ready.
// @result - object with data that will be attached to OSNOVA.
OSNOVA.prototype.moduleReady = function (result) {
  this.ee.emit('MODULE_READY', result);
};

OSNOVA.prototype.next = OSNOVA.prototype.moduleReady;

OSNOVA.prototype.loadModules = function () {
  var modules = this.moduleQueue;
  if (!this.syncModuleLoading) {
    for (var i in modules) {
      modules[i].osnova = this;
      modules[i].fn(this);
    }
  } else {
    this.currentModule = this.firstModule;
    executeModule(this, this.currentModule);
  }
};

// Entry point of the server.
OSNOVA.prototype.start = function (callback) {
  var _this = this;

  printHello('OSNOVA', this.__version);

  if ((0, _osnovaLib.isFunction)(callback)) {
    this.add(function (osnova) {
      callback(osnova);
      _this.next();
    });
  }

  this.loadModules();
};

function OSNOVA_DEFAULT(opts) {
  return new OSNOVA(opts);
}

var Server = exports.Server = OSNOVA_DEFAULT;