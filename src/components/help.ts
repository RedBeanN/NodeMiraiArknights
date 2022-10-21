import Component from './component';

const masterCmd = `
  更新：更新干员资料
  设置前缀#：将命令前缀设置为#
  添加1234：将群号1234添加到白名单
  删除1234：将群号1234从白名单删除
  重启：尝试重启机器人
`;
const baseCmd = `
  查询XX：查询名为XX的干员资料
  [[XX]]：在 prts.wiki 上查询 XX
`;

const help = new Component('help', [{
  rules: [/帮助|说明|操作|指南/],
  handler ({ isMaster, isGroup, atBot, reply }) {
    if (!atBot) return;
    let ret = '指令一览：\n' + baseCmd.trim();
    if (isMaster && !isGroup) {
      ret += '\n管理指令：\n' + masterCmd.trim();
    }
    return reply(ret);
  },
}], true);
export default help;
