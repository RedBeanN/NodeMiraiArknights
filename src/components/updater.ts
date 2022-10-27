// import Progress from 'progress';
import syncData, { setShowProgress } from '../syncData';
import Component from './component';

let updateState = 0;
const updater = new Component('updater', [{
  command: true,
  rules: [/^更新$/],
  handler ({ isGroup, isMaster, senderId, isOwner, isAdmin, config, reply }) {
    const conf = config.manage.updater;
    if (!conf.group && isGroup) return;
    if (!conf.admin && isAdmin && !isOwner) return reply('权限不足');
    if (!conf.owner && isOwner && !isMaster) return reply('权限不足');
    if (updateState) {
      if (updateState === senderId) return reply('正在更新中，请勿重复尝试');
      if (isMaster) return reply(`正在更新中，更新指令由 ${updateState} 发出`);
    }
    updateState = senderId;
    if (conf.showProgress) setShowProgress(true);
    else setShowProgress(false);
    let prevTime = Date.now() - 30_000;
    // const progress = conf.showProgress ? new Progress(':bar (:curr / :total) :comment', { total: 4 }) : null;
    syncData((curr, total, comment) => {
      // if (conf.showProgress) {
      //   progress.tick({ curr, total, comment })
      // }
      if (!conf.sendProgress) return;
      if (Date.now() - prevTime > 30_000 || comment) {
        if (!comment) prevTime = Date.now();
        const info = comment ? '正在更新' : '正在下载';
        reply(`${info}: ${curr} / ${total} (${(curr / total * 100).toFixed(2)}%) ${comment || ''}`);
      }
    }).then(() => reply('更新完成'))
      .catch(() => reply('更新异常'))
      .finally(() => {
        // if (conf.showProgress) progress.terminate()
        updateState = 0
      });
  },
}]);

export default updater;
