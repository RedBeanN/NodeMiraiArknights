import Mirai, { GroupPermissionInfo, message, MessageChain } from 'node-mirai-sdk';
import { MessageResponse, Permission, ChainType, Friend, GroupSender } from 'node-mirai-sdk/type';
import { ArknightsConfig } from './config';

interface ReplyFunction {
  (message: string | MessageChain[]): Promise<MessageResponse>
}
export interface Context {
  config: Required<ArknightsConfig>,
  message: message, msg: string, bot: Mirai, cmd: string,
  atBot: boolean, atAll: boolean, ats: number[],
  sender: Friend | GroupSender, senderId: number, senderName: string,
  isGroup: boolean, group: GroupPermissionInfo | null, groupId: number | undefined,
  isMaster: boolean, isOwner: boolean, isAdmin: boolean,
  isBanned: boolean,
  reply: ReplyFunction,
  quoteReply: ReplyFunction,
}
const resolveMessage = (message: message, bot: Mirai, config: Required<ArknightsConfig>) => {
  const botAlias = typeof config.botAlias === 'string' ? [config.botAlias] : config.botAlias;
  let msg = '', atBot = false, atAll = false;
  const ats: number[] = [];
  const { messageChain, sender, reply, quoteReply } = message;
  for (const chain of messageChain) {
    switch (chain.type) {
      case ChainType.At: {
        if (chain.target === bot.qq) atBot = true;
        else ats.push(chain.target);
        break;
      }
      case ChainType.AtAll: {
        atAll = true;
        break;
      }
      case ChainType.Plain: {
        botAlias.forEach(alias => {
          while (chain.text.includes(alias)) {
            chain.text = chain.text.replace(alias, '');
            if (chain.text.match(/^\s|,|，/)) chain.text = chain.text.substring(1);
            atBot = true;
          }
        });
        msg += chain.text;
        break;
      }
    }
  }
  msg = msg.trim();
  const cmd = msg.startsWith(config.prefix) ? msg.substring(config.prefix.length) : '';
  const ctx: Context = {
    config,
    message, msg, bot, cmd,
    atBot, atAll, ats,
    sender, senderId: sender.id, senderName: '',
    isGroup: false, group: null, groupId: undefined,
    isMaster: false, isOwner: false, isAdmin: false, isBanned: false,
    reply, quoteReply,
  }
  ctx.isMaster = config.masters.includes(sender.id);
  if ('group' in sender) {
    ctx.senderName = sender.memberName as string;
    const group = sender.group;
    ctx.isGroup = true;
    ctx.group = group;
    ctx.groupId = group.id;
    if (config.group === false) {
      ctx.isBanned = true;
      return ctx;
    }
    ctx.isOwner = ctx.isMaster || sender.permission === Permission.OWNER;
    ctx.isAdmin = ctx.isOwner || sender.permission === Permission.ADMINISTRATOR;
    if (Array.isArray(config.group.whiteList)) {
      if (!config.group.whiteList.includes(group.id)) ctx.isBanned = true;
      else if (Array.isArray(config.group.blackList)) {
        if (config.group.blackList.includes(group.id)) ctx.isBanned = true;
      }
    } else if (Array.isArray(config.group.blackList)) {
      if (config.group.blackList.includes(group.id)) ctx.isBanned = true;
    }
  } else {
    ctx.senderName = sender.remark || sender.nickname;
  }
  return ctx;
}

export default resolveMessage
