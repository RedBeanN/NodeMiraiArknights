import Component from './component';

const randTail = () => {
  return [
    '。', '！', '~', '哦', ''
  ][Math.floor(Math.random() * 5)];
}
const atBot = new Component('atBot', [{
  rules: [({ msg, atBot, isGroup, config }) => {
    // 未 at 机器人且设置了 at 时才响应
    if (!atBot && config.atBot && isGroup && isNaN(parseInt(msg))) return true;
    // at 机器人, 并且没有指令
    if (atBot && config.atBot && isGroup && msg === '') return true;
    return false;
  }],
  handler ({ msg, atBot, isGroup, reply }) {
    if (atBot && msg === '' && isGroup) reply('我在' + randTail());
  },
}], true);

export default atBot;
