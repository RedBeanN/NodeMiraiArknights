import Component from './component';

const masterCmd = `
  {{prefix}}更新：更新干员资料
  {{prefix}}设置前缀#：将命令前缀设置为#
  {{prefix}}添加1234：将群号1234添加到白名单
  {{prefix}}删除1234：将群号1234从白名单删除
  {{prefix}}重启：尝试重启机器人
`;
const baseCmd = `
  {{prefix}}查询XX：查询名为XX的干员资料
  {{prefix}}[[XX]]：在 prts.wiki 上查询 XX
`;

const help = new Component('help', [{
  rules: [/帮助|说明|操作|指南/],
  handler ({ isMaster, isGroup, atBot, reply, config }) {
    if (!atBot) return;
    const prefix = config.prefix;
    let ret = '指令一览：' + baseCmd;
    if (isMaster && !isGroup) {
      ret += '管理指令：' + masterCmd;
    }
    return reply(ret.replace(/{{prefix}}/g, prefix).trim());
  },
}], true);
export default help;
