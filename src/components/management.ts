import axios from 'axios';
import { execSync, spawn, spawnSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import NodeMiraiArknights from '..';
import { tmpDir } from '../../root';
import Component from './component';

const restartStatePath = resolve(tmpDir, '_restart_');
if (existsSync(restartStatePath)) {
  try {
    const { host, sessionKey, senderId, time } = JSON.parse(readFileSync(restartStatePath, { encoding: 'utf-8' }));
    const now = Date.now();
    if (now - (time as number) < 10_000) {
      // < 10s
      const mili = now - (time as number);
      axios.post(`${host}/sendFriendMessage`, {
        sessionKey, target: senderId,
        messageChain: [{ type: 'Plain', text: `重启成功, 耗时 ${mili} 毫秒` }],
      }).catch(e => {
        console.log('[Arknights] Error sending restart message', e.message || e);
        console.log(host, sessionKey, senderId, time);
      });
    } else {
      console.log('longer than 10s')
    }
    rmSync(restartStatePath);
  } catch (e) {
    console.log(e);
  }
}

const tryRestartApp = () => {
  const pid = process.pid;
  const tryForever = () => {
    const res = execSync('forever list');
    const withPid = res.toString().split('\n').map(i => i.split(/\s+/)).find(i => i.find(p => p === pid.toString()))
    if (withPid && withPid.length) {
      const val = parseInt(withPid[1].substring(1));
      console.log(`Restart with forever ${val} ${pid}`);
      execSync(`forever restart ${val}`);
    }
  }
  const tryPm2 = () => {
    const res = execSync('pm2 list');
    const withPid = res.toString().split('\n').map(i => i.split(/\s+/)).find(i => i.find(p => p === pid.toString()))
    if (withPid && withPid.length) {
      const val = parseInt(withPid[3]);
      console.log(`Restart with pm2 ${val} ${pid}`)
      execSync(`pm2 restart ${val}`);
    }
  }
  const direct = () => {
    process.once('exit', () => {
      spawn(process.argv.shift(), process.argv, {
        detached: true,
        cwd: process.cwd(),
        stdio: 'inherit',
      }).unref();
    });
    process.exit();
  }
  try {
    tryForever();
  } catch (e) {
    try {
      tryPm2();
    } catch (e) {
      direct();
    }
  }
}

const management = new Component('management', [{
  rules: [({ cmd, isMaster }) => {
    if (!isMaster) return false;
    return ['添加', '删除', '设置前缀', '重启', '关机'].some(c => cmd.startsWith(c));
  }],
  handler ({ cmd, isMaster, senderId, reply, config, bot }, plugin) {
    // This is not needed.
    if (!isMaster) return reply('权限不足');
    if (cmd.startsWith('设置前缀')) {
      const prefix = cmd.substring(4).trim();
      config.prefix = prefix;
      plugin.setConfig(config);
      return reply('设置成功');
    }
    if (cmd.startsWith('添加') || cmd.startsWith('删除')) {
      const isAdd = cmd.startsWith('添加');
      const gid = parseInt(cmd.substring(2).trim());
      if (isNaN(gid)) return reply('群号错误');
      if (!config.group || typeof config.group !== 'object') {
        config.group = { whiteList: [], blackList: false }
      }
      if (typeof config.group.whiteList !== 'object') {
        config.group.whiteList = [];
        // arknights.setConfig(config);
      }
      // if (typeof config.group.whiteList !== 'object') return;
      if (config.group.whiteList.includes(gid)) {
        if (isAdd) return reply('此群号已添加');
        else {
          config.group.whiteList.splice(config.group.whiteList.indexOf(gid));
          plugin.setConfig(config);
          return reply('删除群号成功');
        }
      } else {
        if (isAdd) {
          config.group.whiteList.push(gid);
          plugin.setConfig(config);
          return reply('添加群号成功');
        } else return reply('未添加此群号');
      }
    }
    if (cmd === '重启') {
      const { host, sessionKey } = bot;
      writeFileSync(restartStatePath, JSON.stringify({ host, sessionKey, senderId, time: Date.now() }));
      tryRestartApp();
    }
    if (cmd === '关机') {
      process.exit(0);
    }
  },
}]);
export default management;
