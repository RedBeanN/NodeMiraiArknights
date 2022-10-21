import { existsSync } from 'fs';
import Mirai from 'node-mirai-sdk';
import { resolve } from 'path';
import sharp, { OverlayOptions } from 'sharp';
import { statics, tmpDir } from '../../root';
import { Character } from '../types';
import Component from './component';
import { getGachaCharacterTable } from './searchCharacter';

const { Image, Plain, At } = Mirai.MessageComponent;

const rand = <T>(arr: T[]) => {
  if (!arr) return null;
  return arr[Math.floor(Math.random() * (arr.length - 1))] || null;
};

const cooldowns = new Map<number, number[]>();
const gachaCounter = new Map<number, number>();

const bgPath = resolve(statics, '../assets/gacha/background.png');
const gachaBg = sharp(resolve(statics, '../assets/gacha/background.png'));
const generatePng = async (withRarity?: number) => {
  const table = getGachaCharacterTable();
  const id = Date.now().toString();
  const dist = resolve(tmpDir, id + '.png');
  const chars: Character[] = [];
  if (withRarity) {
    chars.push(rand(table[withRarity]));
  }
  for (let i = 0; chars.length < 10; i++) {
    const r = Math.random();
    if (r < 0.02) chars.push(rand(table[5]));
    else if (r < 0.1) chars.push(rand(table[4]));
    else if (r < 0.58) chars.push(rand(table[3]));
    else chars.push(rand(table[2]));
  }
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (chars.length - i));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const draws: OverlayOptions[][] = await chars.reduce(async (p, char, index) => {
    const prev = await p
    if (!char) return prev;
    const res = [{
      input: await sharp(resolve(statics, `../assets/gacha/r${char.rarity}.png`)).resize(123).toBuffer(),
      left: 27 + index * 123,
      top: 0,
    }, {
      input: await sharp(resolve(statics, `portrait/${char.character}_1.png`))
        .resize(123, 365, { fit: 'cover' }).toBuffer(),
      left: 27 + index * 123,
      top: 175,
    }, {
      input: await sharp(resolve(statics, `../assets/gacha/${char.profession}.png`)).resize(109).toBuffer(),
      left: Math.floor(34 + index * 122.5),
      top: 490,
    }];
    prev.push(res);
    return prev;
  }, Promise.resolve([]));
  await gachaBg.composite(draws.flat(Infinity) as OverlayOptions[]).toFile(dist);
  return dist;
};

const gacha = new Component('gacha', [{
  rules: [/^十连寻访$/],
  command: true,
  async handler ({ message, senderId, groupId, isGroup, reply, bot, config }) {
    if (!existsSync(bgPath)) return reply('数据未初始化，无法进行模拟抽卡');
    const cooldown = config.gacha.cooldown;
    if (isGroup) {
      const cd = cooldowns.get(groupId);
      if (cd && cd.includes(senderId)) {
        return reply(`每 ${Math.floor(cooldown / 1000)} 秒只能寻访一次哦~`);
      }
    }
    const gachaCount = gachaCounter.get(senderId) || 0;
    let withRarity = 0;
    if (!gachaCount) withRarity = 4;
    else if (gachaCount > 5) {
      gachaCounter.set(senderId, 0);
      withRarity = 5;
    } else {
      gachaCounter.set(senderId, gachaCount + 1);
    }
    const dist = await generatePng(withRarity);
    if (isGroup) {
      if (!cooldowns.has(groupId)) cooldowns.set(groupId, []);
      const cd = cooldowns.get(groupId);
      if (cd.includes(senderId)) {
        return reply(`每 ${Math.floor(cooldown / 1000)} 秒只能寻访一次哦~`);
      }
      cd.push(senderId);
      setTimeout(() => {
        if (cd.includes(senderId)) cd.splice(cd.indexOf(senderId), 1);
      }, cooldown)
    }
    const img = await bot.uploadImage(dist, message);
    reply([At(senderId), Plain(' 本次寻访结果：\n'), Image(img)]).then(res => {
      if (config.gacha.recall) {
        setTimeout(() => {
          res.recall();
        }, config.gacha.recallTime)
      }
    }).catch(e => {
      console.log('Error sending gacha image', e.message || e);
      reply('模拟抽卡出现异常');
      if (isGroup && cooldowns.has(groupId)) {
        const cd = cooldowns.get(groupId);
        if (cd.includes(senderId)) cd.splice(cd.indexOf(senderId), 1);
      }
    });
  },
}], true);

export default gacha;
