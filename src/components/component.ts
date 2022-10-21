import { ArknightsPlugin } from '..';
import { Context } from '../resolveMessage';

export interface ComponentHandler {
  (ctx: Context, plugin: ArknightsPlugin): any
}

export interface Rule {
  /** 匹配此组件的规则, 正则 */
  rules: Array<RegExp | ((msg: Context) => boolean)>
  handler: ComponentHandler
  /** 使用去除了前缀的字符串匹配正则 */
  command?: boolean
}

const noLogComponents = ['messageLogger', 'atBot'];

export default class Component {
  name = 'Component'
  rules: Rule[]
  handler: ComponentHandler
  skipOther = false
  constructor (name: string, rules: Rule[], skipOther: boolean = false) {
    this.rules = rules
    this.name = name
    if (skipOther) this.skipOther = true
  }

  run (ctx: Context, plugin: ArknightsPlugin) {
    for (const rule of this.rules) {
      const { rules, handler, command } = rule;
      if (rules.some(reg => {
        if (reg instanceof RegExp) {
          if (command) {
            if (!ctx.cmd) return false;
            return reg.test(ctx.cmd);
          }
          return reg.test(ctx.msg);
        }
        if (typeof reg === 'function') return reg(ctx);
      })) {
        if (ctx.config.logMessage && !noLogComponents.includes(this.name)) {
          console.log(`[Arknights] Component [${this.name}] handled this message.`);
        }
        handler(ctx, plugin);
        return this.skipOther;
      }
    }
    return false;
  }
}
