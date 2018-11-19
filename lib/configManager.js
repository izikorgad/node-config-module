'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateConfig = exports.setConfigChangeCallback = exports.getConfig = exports.init = undefined;

var _lodash = require('lodash');

var _ = _interopRequireWildcard(_lodash);

var _gracefulFs = require('graceful-fs');

var fs = _interopRequireWildcard(_gracefulFs);

var _path = require('path');

var path = _interopRequireWildcard(_path);

var _chokidar = require('chokidar');

var chokidar = _interopRequireWildcard(_chokidar);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

let configFileName = 'config.json';
let config = {};
let prevConfig = {}; // Previous configuration
let watcher;
let configChangeCallback = [];

const createDefaultConfigFile = defaultConfig => {
  config = defaultConfig;
  updateConfig();
};

const configFileExists = (configFile = configFileName) => {
  try {
    const stat = fs.statSync(configFile);
    if (stat) {
      console.log(`Config file found at ${configFile}.`);
      return true;
    }
  } catch (e) {
    if (e.code == 'ENOENT') {
      console.log(`Config file not found at ${configFile}.`);
    } else {
      console.log(`Config file check error at ${configFile}: ${e}`);
    }
    return false;
  }
};

const init = exports.init = (defaultConfig, newConfigFileName, cb) => {
  try {
    console.log('Config initializing...');

    if (newConfigFileName != null) {
      configFileName = newConfigFileName;
    }

    // Ensure config file exists, or create a default one
    if (!configFileExists()) {
      createDefaultConfigFile(defaultConfig);
    } else {
      readConfig(); // Read to config object
    }

    // Watch for file changes
    watchChokidar();

    cb(null, config);
  } catch (ex) {
    console.log(ex);
  }
};

const getConfig = exports.getConfig = () => {
  if (!config || _.size(config) === 0) {
    readConfig();
  }
  return config;
};

const readConfig = (configFile = configFileName) => {
  const resolvedPath = path.resolve(configFile);

  if (!configFileExists(resolvedPath)) {
    throw new Error(`Config file not found at ${resolvedPath}.`);
  }

  const content = fs.readFileSync(resolvedPath);

  config = parseConfigContent(content);
  console.log(`config read: ${JSON.stringify(config)}, file: ${resolvedPath}.`);
};

const parseConfigContent = content => {
  const newConfig = JSON.parse(content);

  return newConfig;
};

const setConfigChangeCallback = exports.setConfigChangeCallback = (who, cb) => {
  console.log(`${who} registered for config change notification.`);
  configChangeCallback.push(cb);
};

// nodes.ini watcher for changes.
const watchChokidar = () => {

  watcher = chokidar.watch(configFileName);

  watcher.on('change', function () {

    watcher.unwatch(configFileName);

    // Wait a little to let the file finish writing; then re-read config and do callbacks
    setTimeout(function () {

      // Since not coming from updateConfig() we need to record the preConfig here
      prevConfig = Object.assign({}, config);

      readConfig();

      console.log(`prev config: ${JSON.stringify(prevConfig)}`);
      console.log(`new config: ${JSON.stringify(config)}`);

      if (configChangeCallback) {
        configChangeCallback.map(c => {
          try {
            c(config, prevConfig);
          } catch (err) {
            console.log('On configChangeCallback', err);
          }
        });
      }
      watchChokidar();
    }, 500);
  });

  console.log('Config file watch in place.');
};

const updateConfig = exports.updateConfig = attributes => {
  // Create a newConfig object from config and update its properties.
  // When written to file, Chokidar file watcher will save the prevConfig and read the new config.
  const newConfig = Object.assign({}, config);

  console.log(`new config attributes: ${JSON.stringify(attributes)}`);

  if (attributes) {
    _.forEach(attributes, function (value, key) {
      newConfig[key] = value;
    });
  }

  console.log(`new config: ${JSON.stringify(newConfig)}`);

  const content = JSON.stringify(newConfig, null, 3);

  try {

    const dirName = path.dirname(configFileName);
    // Create config directory if it does not exist
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }

    fs.writeFileSync(configFileName, content, { mode: '0777' });
    console.log(`Config file updated: ${content}`);
    return newConfig;
  } catch (ex) {
    console.log(`Config file update error: ${ex.message}`);
    return false;
  }
};

if (process.env.npm_lifecycle_event === 'test') {
  module.exports = { init, createDefaultConfigFile, configFileExists, parseConfigContent, updateConfig, readConfig, getConfig, setConfigChangeCallback };
}