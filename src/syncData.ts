import { readFile, writeFile } from 'fs/promises'
import { existsSync, writeFileSync, mkdirSync, readFileSync, readdir, statSync, rm } from 'fs'
import { resolve, dirname } from 'path'
import Progress from 'progress'
import getUrl from '../utils/getUrl'
import parallel from '../utils/parallel'
import download from '../utils/download'
import getMd5 from '../utils/getMd5'

const repo = 'https://ghproxy.com/https://raw.githubusercontent.com/yuanyan3060/Arknights-Bot-Resource/main/';
// const repo = 'https://raw.fastgit.org/yuanyan3060/Arknights-Bot-Resource/main/';
import { statics, assets, tmpDir } from '../root'
import { Job, RecurrenceRule, scheduleJob } from 'node-schedule'
import { ArknightsConfig } from './config'
import delay from '../utils/delay'
import { updateRanges } from '../utils/getRange'
import { updateSkills } from '../utils/getSkill'

type OnProgress = (current: number, total: number, comment?: string) => void;

/**
 * NOTE: ghproxy needs encode twice for `'#'`.
 * Comment `.replace(/%23/g, '%2523')` if using fastgit.
 */
const useFG = repo.startsWith('https://raw.fastgit.org')
const repoUrl = (p: string) => repo + encodeURIComponent(p).replace(/%2F/g, '/').replace(/%23/g, useFG ? '%23' : '%2523');
const localPath = (p: string) => resolve(statics, p);
const getPath = (p: string) => [repoUrl(p), localPath(p)];

let shouldShowProgress = false;
const log = (...args: any[]) => shouldShowProgress ? console.log(...args) : void 0;
const writeLine = (...args: any[]) => {
  if (!shouldShowProgress) return;
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`  > ${args.join(' ')}`);
};

const touch = (p: string, d: string = '') => {
  if (!existsSync(p)) {
    const dir = dirname(p);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(p, d || '')
  }
};

/** @type { Map<string, string|{ [key: string]: string }> } */
const patches: Map<string, string | { [key: string]: string }> = new Map();
const saveAll = async () => {
  for (const [path, data] of patches.entries()) {
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (typeof data === 'object') {
      try {
        await writeFile(path, JSON.stringify(data, null, 2));
        log(`Saved ${path}`);
      } catch (e) {
        log(`Error: cannot save ${path} since ${data} is not stringify`);
      }
    } else {
      await writeFile(path, data);
      log(`Saved ${path}`);
    }
  }
  updateRanges();
  updateSkills();
  return true;
};

const syncVersion = async () => {
  const [url, local] = getPath('version');
  log('Get version from', url);
  const { data: version } = await getUrl(url);
  if (version && typeof version !== 'string') {
    log('Cannot get version', version);
    return false;
  }
  touch(local, '');
  const localVersion = (await readFile(local)).toString();
  if (localVersion !== version) {
    log(`Version updated. ${localVersion} => ${version}`)
    patches.set(local, version);
    return true;
  }
  return process.argv.includes('--full');
};

const syncFileDict = async () => {
  const [url, local] = getPath('file_dict.json');
  const { data: dict } = await getUrl(url);
  if (typeof dict !== 'object') return null;
  touch(local, '{}');
  const oldDict = JSON.parse((await readFile(local)).toString());
  const news = [];
  if (process.argv.includes('--full')) {
    news.push(...Object.keys(dict));
  } else {
    for (const key in dict) {
      if (!oldDict[key] || oldDict[key] !== dict[key]) {
        news.push(key);
      }
    }
  }
  patches.set(local, dict);
  return { news, dict };
};

const noChange = [];
const syncFiles = async (news: string[], dict: { [key: string]: string }, onProgress: OnProgress = () => {}) => {
  const len = news.length;
  const strLen = len.toString().length;
  log(`Start downloading ${len} files`);
  let ctr = 0;
  const results = await parallel(news, async file => {
    const [url, local] = getPath(file);
    const md5 = await getMd5(local);
    try {
      if (dict[file] !== md5) await download(url, local, true);
      else noChange.push(file);
      ctr++;
      onProgress(ctr, len);
      const percent = ((ctr / len) * 100).toFixed(2).padStart(6, ' ') + '%';
      const progress = `${ctr.toString().padStart(strLen, ' ')}/${len} ${percent}`;
      writeLine(`${progress} - ${file}`);
      return true;
    } catch (e) {
      dict[file] = 'error';
      ctr--;
      writeLine(`${file} download error ${e}\r\n`)
      return false;
    }
  }, 10);
  log(`\nDone.`);
  return results;
};

const syncProfessions = async (onProgress: OnProgress = () => {}) => {
  const iconUrlJson = resolve(assets, 'data/professionIcons.json');
  const iconUrlConfig: { [key: string]: string } = JSON.parse(readFileSync(iconUrlJson, { encoding: 'utf-8' }));
  const targetDir = resolve(statics, '../assets/professions');
  if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });
  const keys = Object.keys(iconUrlConfig);
  for (const prof of keys) {
    const url = iconUrlConfig[prof];
    const dist = resolve(targetDir, `${prof}.png`);
    if (existsSync(dist)) continue;
    await download(url, dist, true)
  }
  return onProgress(5, 5, '本地资源加载完成');
};
const syncGacha = async (onProgress: OnProgress = () => {}) => {
  const repo = 'https://ghproxy.com/https://raw.githubusercontent.com/yuanyan3060/SkadiBot/master/data/static';
  const distDir = resolve(statics, '../assets/gacha');
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
  const mainBg = repo + '/gacha_background_img/2.png';
  const mainDist = resolve(distDir, 'background.png')
  if (!existsSync(mainDist)) await download(mainBg, mainDist);
  for (let i = 2; i < 6; i++) {
    const rDist = resolve(distDir, `r${i}.png`)
    if (!existsSync(rDist)) await download(`${repo}/gacha_rarity_img/${i}.png`, rDist);
  }
  const profs = [ 'CASTER', 'MEDIC', 'PIONEER', 'SNIPER', 'SPECIAL', 'SUPPORT', 'TANK', 'WARRIOR'];
  for (const prof of profs) {
    const pDist = resolve(distDir, `${prof}.png`)
    if (!existsSync(pDist)) await download(`${repo}/profession_img/${prof}.png`, pDist);
  }
  return onProgress(4, 5, '抽卡资源加载完成')
};

const syncSteps = async (onProgress: OnProgress = () => {}) => {
  log('Syncing version');
  onProgress(1, 5, '检查版本更新');
  if (!await syncVersion()) {
    log('No new version was found');
    onProgress(3, 5, '当前版本已是最新, 检查本地资源');
    await delay(1000);
    await syncGacha(onProgress);
    await delay(1000);
    return syncProfessions(onProgress);
  }
  onProgress(2, 5, '同步文件列表')
  await delay(1000);
  const dictObj = await syncFileDict();
  if (!dictObj) {
    log('Cannot sync file dict object');
    return;
  }
  log(`Ready to update ${dictObj.news.length} files`);
  onProgress(3, 5, '准备下载文件')
  const results = await syncFiles(dictObj.news, dictObj.dict, onProgress);
  if (results.every(i => i)) {
    log('All files are downloaded successfully');
  } else {
    const failed = results.filter(i => !i).length;
    log(`${failed} files are failed to download.`);
    const [url, local] = getPath('version');
    patches.delete(local);
  }
  await syncGacha(onProgress);
  await delay(1000);
  await syncProfessions(onProgress);
};

let isSyncing = false
const syncData = async (onProgress: OnProgress = () => {}) => {
  if (isSyncing) return;
  log('Start sync')
  try {
    await syncSteps(onProgress);
    await saveAll();
    log('Done.');
    if (noChange.length) {
      log(`${noChange.length} files are not changed`);
    }
  } catch (e) {
    log('Error @ sync', e);
    isSyncing = false;
    throw e;
  }
  await delay(1000);
  isSyncing = false;
  return;
};

if (process.argv.includes('--sync')) {
  shouldShowProgress = true;
  syncData();
}

export default syncData;
export const setShowProgress = (show: boolean) => {
  shouldShowProgress = show;
};

const scheduleConfig: {
  enable: boolean,
  currentJob: Job,
  currentRule: string | RecurrenceRule,
} = {
  enable: false,
  currentJob: null,
  currentRule: null,
}
export const setSyncSchedule = (config: ArknightsConfig['sync']) => {
  if (config.enable === false) {
    scheduleConfig.enable = false;
    scheduleConfig.currentJob.cancel()
    return;
  } else {
    scheduleConfig.enable = true;
    if (!config.schedule) {
      if (scheduleConfig.currentJob && scheduleConfig.currentRule) {
        scheduleConfig.currentJob.reschedule(scheduleConfig.currentRule)
      }
    } else {
      if (scheduleConfig.currentJob) scheduleConfig.currentJob.cancel();
      scheduleConfig.currentRule = config.schedule;
      scheduleConfig.currentJob = scheduleJob(config.schedule, async firedate => {
        if (typeof config.beforeSync === 'function') {
          if ((await config.beforeSync(firedate)) === false) return;
        }
        if (config.showProgress) {
          const progress = new Progress(':bar (:curr / :total) :comment', { total: 3 })
          await syncData((curr, total, comment = '') => {
            progress.tick({ curr, total, comment });
          }).catch(() => {}).then(() => {
            progress.terminate();
          });
        } else {
          await syncData().catch(() => {});
        }
        if (typeof config.synced === 'function') {
          config.synced(new Date());
        }
      })
      // console.log('Next invocation:', scheduleConfig.currentJob.nextInvocation());
    }
  }
}

// Remove old files in tmpDir
const clearRule = new RecurrenceRule();
clearRule.minute = 0;
scheduleJob('Clear tmpDir', clearRule, () => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  readdir(tmpDir, (err, files) => {
    // ignore
    if (err) return;
    files.forEach(file => {
      const p = resolve(tmpDir, file);
      const { mtimeMs } = statSync(p);
      if (mtimeMs + oneHour < now) rm(p, { recursive: true }, () => {});
    });
  });
});
