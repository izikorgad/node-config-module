import { expect } from 'chai';
import path from 'path';
import * as fs from 'graceful-fs';
import * as ConfigManager from './ConfigManager';

describe('ConfigManager', () => {
  after(() => {
    const filePath = path.join(__dirname, '../config.json');

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  describe('configFileExists', () => {
    beforeEach(() => {
      const filePath = path.join(__dirname, '../config.json');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('configFileExists -> File does not exist', async function () {
      const configFile = 'fileDoesNotExist.json';
      const res = await ConfigManager.configFileExists(configFile);

      expect(res).to.be.false;
    });

    it('configFileExists -> File exists', async function () {
      const defaultConfig = {
        HTTP_PORT: 9000,
        LOG: {
          LOG_LEVEL: 'INFO',
          LOG_MAX_FILES: 10,
          LOG_MAX_FILE_SIZE: 5120
        }
      };

      ConfigManager.createDefaultConfigFile(defaultConfig);
      const configFile = path.join(__dirname, '../config.json');
      const res = await ConfigManager.configFileExists(configFile);

      expect(res).to.be.true;
    });
  });

  describe('createDefaultConfigFile', () => {
    before(() => {
      const filePath = path.join(__dirname, '../config.json');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('createDefaultConfigFile -> Valid Configuration', async function () {
      const defaultConfig = {
        HTTP_PORT: 9000,
        LOG: {
          LOG_LEVEL: 'INFO',
          LOG_MAX_FILES: 10,
          LOG_MAX_FILE_SIZE: 5120
        }
      };

      ConfigManager.createDefaultConfigFile(defaultConfig);

      const stat = fs.existsSync(path.join(__dirname, '../config.json'));

      expect(defaultConfig).to.deep.equal(ConfigManager.getConfig());
      expect(stat).to.be.true;
    });
  });

  describe('updateConfig', () => {
    before(() => {
      const filePath = path.join(__dirname, '../config.json');
      const defaultConfig = {
        HTTP_PORT: 9000,
        LOG: {
          LOG_LEVEL: 'INFO',
          LOG_MAX_FILES: 10,
          LOG_MAX_FILE_SIZE: 5120
        }
      };

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      ConfigManager.createDefaultConfigFile(defaultConfig);
    });

    it('updateConfig -> Valid attribute', async function () {
      const updatedHttpPort = 7000;
      const config = ConfigManager.getConfig();
      const updatedConfig = ConfigManager.updateConfig({ 'HTTP_PORT': updatedHttpPort });

      config['HTTP_PORT'] = updatedHttpPort;

      expect(config).to.deep.equal(updatedConfig);
    });
  });

  describe('readConfig', () => {
    it('readConfig -> File does not exist', async function () {
      const filePath = path.join(__dirname, './fileDoesNotExist.json');
      const func = () => ConfigManager.readConfig(filePath);

      expect(func).to.throw(`Config file not found at ${filePath}.`);
    });
  });

  describe('parseConfigContent', () => {
    beforeEach(() => {
      const filePath = path.join(__dirname, '../config.json');

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    it('parseConfigContent -> Valid file content', async function () {
      const validConfig = {
        HTTP_PORT: 5000,
        LOG: {
          LOG_LEVEL: 'INFO',
          LOG_MAX_FILES: 10,
          LOG_MAX_FILE_SIZE: 5120
        }
      };

      ConfigManager.createDefaultConfigFile(validConfig);

      const content = fs.readFileSync(path.join(__dirname, '../config.json'));
      const parsedContent = ConfigManager.parseConfigContent(content);

      expect(validConfig).to.deep.equal(parsedContent);
    });

    it('parseConfigContent -> Invalid file content', async function () {
      const invalidConfig = [{
        HTTP_PORT: 5000,
        LOG: {
          LOG_LEVEL: 'INFO',
          LOG_MAX_FILES: 10,
          LOG_MAX_FILE_SIZE: 5120
        }
      }];

      ConfigManager.createDefaultConfigFile(invalidConfig);

      const content = fs.readFileSync(path.join(__dirname, '../config.json'));
      const parsedContent = ConfigManager.parseConfigContent(content);

      expect(invalidConfig).to.not.equal(parsedContent);
    });
  });
});