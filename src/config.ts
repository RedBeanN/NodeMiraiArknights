import { RecurrenceRule } from 'node-schedule';

export interface ArknightsConfig {
  /**
   * 是否持久化储存配置, 默认 `false`.
   *
   * 设置为 `true` 时每次调用 `setConfig` 后都会保存一遍, 注意初始化时的配置可能被覆盖.
   * 修改初始化参数会导致原配置被覆盖, 建议初始化时只用 `{presist: true}`, 其他的都使用 `setConfig` 设置.
   *
   * 设置为 `false` 时需自行保存配置，否则重启后会重置.
   */
  presist?: boolean,
  /** 同步数据选项 */
  sync?: {
    /** 启用自动同步 */
    enable?: boolean,
    /**
     * 同步日程, 默认凌晨4点.
     * 字符串必须为 `crontab` 格式, 如 `"* * 4 * * *"`
     * 其他格式参考 [node-schedule](https://github.com/node-schedule/node-schedule)
     */
    schedule?: string | RecurrenceRule,
    /** 在控制台显示同步进度 */
    showProgress?: boolean,
    /** 在同步开始前调用, 返回 `false` 会阻止本次同步 */
    beforeSync?: (firedate: Date) => false | any,
    /** 在同步结束后调用 */
    synced?: (enddate: Date) => any,
  },
  /** 指令前缀, 默认 `'#'` */
  prefix?: string,
  /** 是否仅在 at 机器人时响应指令, 仅群聊生效, 默认 `false` */
  atBot?: boolean,
  /** 机器人别名, 群聊中使用别名视为 at 机器人 */
  botAlias?: string | string[],
  /** 群聊设置, 为 `false` 时禁用群聊 */
  group?: {
    /** 白名单群号, 为 `false` 时禁用, 可以用数组方法动态修改, 但替换数组会失效 */
    whiteList?: number[] | false,
    /** 黑名单群号, 为 `false` 时禁用, 可以用数组方法动态修改, 但替换数组会失效 */
    blackList?: number[] | false,
  } | false,
  /** 超级管理员列表 */
  masters?: number[],
  /** 是否在控制台打印消息 */
  logMessage?: boolean,
  /**
   * 插件管理
   */
  manage?: {
    /**
     * 更新数据库相关
     */
    updater?: {
      /**
       * 允许在群聊发送更新指令, 默认 `false`
       */
      group?: boolean,
      /**
       * 允许群主更新数据库, 默认 `false`
       */
      owner?: boolean,
      /**
       * 允许群管理更新数据库, 默认 `false`
       */
      admin?: boolean,
      /**
       * 更新时发送进度, 默认 `true`
       */
      sendProgress?: boolean,
      /**
       * 手动更新在控制台显示进度, 默认 `false`
       */
      showProgress?: boolean,
    },
  },
  /**
   * 干员查询功能
   */
  query?: {
    enable?: boolean,
    /**
     * 单次查询的过期时间, 单位毫秒, 最小60000, `Infinity` 不限时
     */
    timeout?: number,
    /**
     * 一次查询的结果不超过此行数, 最小5
     */
    max?: number,
  },
  /**
   * wiki 功能
   */
  wiki?: {
    enable?: boolean
  }
  /**
   * 模拟十连
   */
  gacha?: {
    enable?: boolean,
    /**
     * 冷却时间, 单位毫秒, 默认 `60000`
     */
    cooldown?: number,
    /**
     * 是否撤回抽卡结果, 默认 `true`
     */
    recall?: boolean,
    /**
     * 撤回延迟, 默认 `30000`
     */
    recallTime?: number,
  }
}
export const getDefaultConfig = (): Required<ArknightsConfig> => {
  const defaultSchedule = new RecurrenceRule();
  defaultSchedule.hour = 4;
  return {
    presist: false,
    sync: {
      enable: true,
      showProgress: false,
      schedule: defaultSchedule,
      beforeSync () {},
      synced () {},
    },
    prefix: '#',
    atBot: false,
    botAlias: [],
    group: {
      whiteList: false,
      blackList: false,
    },
    masters: [],
    logMessage: false,
    manage: {
      updater: {
        group: false,
        owner: false,
        admin: false,
        sendProgress: true,
        showProgress: false,
      },
    },
    query: {
      enable: true,
      timeout: 60_000,
      max: 30,
    },
    wiki: {
      enable: true,
    },
    gacha: {
      enable: true,
      cooldown: 60_000,
      recall: true,
      recallTime: 30_000,
    }
  }
}
export const deepAssign = <T>(a: T, b: Partial<T>) => {
  for (const key in b) {
    if (typeof b[key] === 'object') {
      // a[key] may be `false`
      if (!(key in a)) a[key] = b[key];
      else if (typeof a[key] !== 'object') a[key] = b[key];
      else a[key] = deepAssign(a[key], b[key]);
    } else {
      a[key] = b[key]
    }
  }
  return a;
}
