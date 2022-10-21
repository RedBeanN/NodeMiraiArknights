import { createHash } from 'crypto';
import { existsSync, readFileSync, rmSync, watchFile, writeFileSync } from 'fs';
import Mirai, { message } from 'node-mirai-sdk';
import { resolve } from 'path';
import { statics } from '../root';
import useComponents, { Component, addCustomComponent, removeCustomComponent } from './components';
import { ArknightsConfig, deepAssign, getDefaultConfig } from './config';
import resolveMessage from './resolveMessage';

import syncData, { setSyncSchedule } from './syncData';

let configPath = resolve(statics, '../config.json');
const initConfPath = resolve(statics, '../initConf.json');

export type ArknightsPlugin = {
  /** 在运行过程中动态修改设置 */
  setConfig (newConfig: ArknightsConfig): void,
  /** 获取当前设置 */
  getConfig (): ArknightsConfig,
  /** 手动同步数据 */
  syncData: typeof syncData,
  /**
   * 传给 `node-mirai-sdk` 的插件实例
   * @example
   * const arknights = NodeMiraiArknights({ ... })
   * bot.use(arknights.plugin)
   */
  plugin: {
    name: 'NodeMiraiArknights',
    subscribe: 'message',
    callback (message: message, bot: Mirai): Promise<void>,
  },
}
export default function NodeMiraiArknights (config: ArknightsConfig | string = {}): ArknightsPlugin {
  const usingConfigPath = typeof config === 'string';
  if (typeof config === 'string') {
    if (!existsSync(config)) throw new Error(`Cannot resolve config path ${config}`);
    configPath = config;
    config = JSON.parse(readFileSync(config, { encoding: 'utf-8' })) as ArknightsConfig;
  }
  const conf = getDefaultConfig();
  if (!config.presist && !usingConfigPath) {
    rmSync(initConfPath, { recursive: true });
    rmSync(configPath, { recursive: true });
  }
  let prevMd5 = ''
  const setConfig = (newConfig: ArknightsConfig) => {
    deepAssign(conf, newConfig);
    const toSave = JSON.stringify(conf, null, 2);
    const md5 = createHash('md5').update(toSave).digest('hex');
    if (md5 === prevMd5) return;
    setSyncSchedule(conf.sync);
    if (newConfig.presist) {
      prevMd5 = md5;
      console.log('Config changed. Save.');
      writeFileSync(configPath, JSON.stringify(conf, null, 2));
    }
  };
  const getConfig = () => conf;
  if (usingConfigPath) {
    watchFile(configPath, () => {
      setConfig(JSON.parse(readFileSync(configPath, { encoding: 'utf-8' })));
    });
  }

  if (existsSync(configPath) && existsSync(initConfPath) && !usingConfigPath) {
    const initConf = readFileSync(initConfPath, { encoding: 'utf-8' });
    const curConf = JSON.stringify(config, null, 2);
    if (initConf !== curConf) {
      // Current config updated. Use current instead.
      console.log('Init config changed. Old config removed.')
      writeFileSync(initConfPath, curConf);
      writeFileSync(configPath, curConf);
    } else {
      const oldConf: ArknightsConfig = JSON.parse(readFileSync(configPath, { encoding: 'utf-8' }));
      deepAssign(config, oldConf);
      console.log('Load conf from statics', config.group)
    }
  } else {
    const curConf = JSON.stringify(config, null, 2);
    writeFileSync(initConfPath, curConf);
    writeFileSync(configPath, curConf);
  }
  setConfig(config);

  // console.log('current config', conf);
  const callback = async (message: message, bot: Mirai) => {
    const ctx = resolveMessage(message, bot, conf);
    if (ctx.isBanned) return;
    useComponents(ctx, instance);
  }

  const instance: ArknightsPlugin = {
    /** 在运行过程中动态修改设置 */
    setConfig,
    /** 获取当前设置 */
    getConfig,
    /** 手动同步数据 */
    syncData,
    /** 传给 `node-mirai-sdk` 的插件实例 */
    plugin: {
      name: 'NodeMiraiArknights',
      subscribe: 'message',
      callback,
    },
  };
  return instance
};
export { syncData, addCustomComponent, removeCustomComponent, Component }
