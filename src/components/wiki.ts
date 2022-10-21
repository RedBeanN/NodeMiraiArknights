import MWBot from 'mwbot';
import Component from './component';

enum botName {
  prts = 'prts',
  moegirl = 'moegirl',
  mooncell = 'mooncell',
}
const apiUrls = {
  [botName.prts]: 'https://prts.wiki/api.php',
  [botName.moegirl]: 'https://zh.moegirl.org.cn/api.php',
  [botName.mooncell]: 'https://fgo.wiki/api.php',
}
const wikiNames = {
  [botName.prts]: 'PRTS',
  [botName.moegirl]: '萌娘百科',
  [botName.mooncell]: 'MoonCell',
}
const bots = new Map<botName, MWBot>();
const getBot = (type: botName) => {
  if (bots.has(type)) return bots.get(type);
  if (apiUrls[type]) {
    const apiUrl = apiUrls[type];
    const bot = new MWBot({ apiUrl });
    bot.globalRequestOptions.headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78',
    };
    bot.globalRequestOptions.timeout = 30000;
    bots.set(type, bot);
    return bot;
  };
  return null;
}
// const apiUrl = 'https://prts.wiki/api.php';
// const bot = new MWBot({ apiUrl });
// bot.globalRequestOptions.headers = {
//   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36 Edg/92.0.902.78',
// };
// bot.globalRequestOptions.timeout = 30000;

const getUrl = (apiUrl: string, params = {}, script = 'index') => {
  let query = '';
  if (Object.keys(params).length) {
    query = '?' + new URLSearchParams(params);
  }
  return `${apiUrl.replace('/api.php', `/${script ? script.trim() : 'index'}.php`)}${query}`;
};

export const searchWiki = async (title: string, bot: MWBot = getBot(botName.prts)) => {
  if (!title) return getUrl(bot.options.apiUrl);
  let anchor = '';
  if (title.split('#').length > 1) anchor = '#' + encodeURI(title.split('#')[1] || '');
  const { query, error } = await bot.request({
    action: 'query',
    formatversion: 2,
    prop: 'extracts|info',
    meta: 'siteinfo',
    siprop: 'specialpagealiases|namespaces',
    iwurl: 1,
    titles: title,
    redirects: 1,
    converttitles: 1,
    exchars: '150',
    exlimit: 'max',
    explaintext: 1,
    inprop: 'url|displaytitle',
  });
  if (!query) return `查询出错${error ? ': ' + error : ''}`;
  const {
    redirects: rawRedirects,
    pages: rawPages,
    interwiki,
    specialpagealiases,
    namespaces,
  } = query;
  const msg = []

  let pages: Partial<typeof rawPages['0']>[] = rawPages
  let redirects = rawRedirects
  if (interwiki && interwiki.length) {
    msg.push(`跨语言链接：${interwiki?.[0]?.url}${anchor}`)
  } else {
    /**
     * @desc 某些特殊页面会暴露服务器 IP 地址，必须特殊处理这些页面
     *       已知的危险页面包括 Mypage Mytalk
     */
    const dangerPageNames = ['Mypage', 'Mytalk']
    // 获取全部别名
    const dangerPages = specialpagealiases
      .filter((spAlias: any) => dangerPageNames.includes(spAlias.realname))
      .map((spAlias: any) => spAlias.aliases)
      .flat(Infinity)
    // 获取本地特殊名字空间的标准名称
    const specialNsName = namespaces['-1'].name
    if (
      // 发生重定向
      redirects &&
      // 重定向自特殊页面
      redirects[0].from.split(':').shift() === specialNsName &&
      // 被标记为危险页面
      dangerPages.includes(redirects[0].from.split(':').pop().split('/').shift())
    ) {
      // 覆写页面资料
      pages = [{
        ns: -1,
        title: redirects[0].from,
        special: true,
      }]
      // 重置重定向信息
      redirects = undefined
    }
    const thisPage = pages[0]
    const {
      pageid,
      title: pagetitle,
      missing,
      invalid,
      special,
      editurl,
    } = thisPage

    msg.push(`您要的 ${pagetitle}：`)
    if (redirects && redirects.length > 0) {
      const { from, to, tofragment } = redirects[0]
      msg.push(`重定向：[${from}] → [${to}${tofragment ? '#' + tofragment : ''}]`)
      if (tofragment) anchor = '#' + encodeURI(tofragment)
    }
    if (invalid !== undefined) {
      msg.push(`页面名称不合法：${thisPage.invalidreason || '原因未知'}`)
    } else if (special) {
      msg.push(
        `${getUrl(bot.options.apiUrl, {
          title: pagetitle,
        })}${anchor} (${missing ? '不存在的' : ''}特殊页面)`,
      )
    } else if (missing !== undefined) {
      msg.push(`${editurl} (页面不存在)`);
    } else {
      msg.push(getUrl(bot.options.apiUrl, { curid: pageid }) + anchor);
    }
  }
  const result = msg.join('\n');
  return result;
};

const wiki = new Component('wiki', [{
  rules: [({ cmd, config }) => {
    if (!config.wiki || !config.wiki.enable) return false
    return /\[\[.+]]/.test(cmd);
  }],
  async handler ({ msg, cmd, reply }) {
    let wikiType: botName = botName.prts;
    if (/mooncell|mc/.test(cmd.toLowerCase())) {
      wikiType = botName.mooncell;
    } else if (cmd.startsWith('萌百') || cmd.startsWith('萌娘')) {
      wikiType = botName.moegirl;
    }
    const wikiName = wikiNames[wikiType];
    const matches = [...msg.matchAll(/\[\[(.+?)]]/g)].map(i => i && i[1]).filter(i => i);
    const result: string[] = [];
    for (const text of matches) {
      try {
        const search = await searchWiki(text, getBot(wikiType));
        result.push(search);
      } catch (e) {
        console.log(`[${wikiName}] Error: ${e.message || e}`);
        return reply(`访问${wikiName}时出错了`);
      }
    }
    if (result.length) return reply(result.join('\n'));
  },
}], true);

export default wiki;
