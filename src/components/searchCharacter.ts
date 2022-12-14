import { existsSync, readFileSync, rmSync, statSync, watchFile } from 'fs';
import { resolve } from 'path';
import { statics, tmpDir } from '../../root';
import drawImage from '../../utils/drawImage';
import getMd5 from '../../utils/getMd5';
import { Character } from '../types';
import Component from './component';

type searchObject = {
  timestamp: number,
  characters: Character[],
}
const searchMap = new Map<number, searchObject>();

const charTablePath = resolve(statics, 'gamedata/excel/character_table.json');
const charPatchPath = resolve(statics, 'gamedata/excel/char_patch_table.json');
const uniequipPath = resolve(statics, 'gamedata/excel/uniequip_table.json');
const characterIdMap = new Map<string, string | string[]>();
const characterMap = new Map<string, Character>();
const gachaTable : { [key: number]: Character[] } = {
  [2]: [], [3]: [], [4]: [], [5]: [],
};
const resolveCharacterList = () => {
  if (!existsSync(charTablePath) || !existsSync(charPatchPath) || !existsSync(uniequipPath)) {
    // Files not downloaded. Skip.
    return;
  }
  try {
    const characterTable = JSON.parse(readFileSync(charTablePath, { encoding: 'utf-8' }));
    const characterPatch = JSON.parse(readFileSync(charPatchPath, { encoding: 'utf-8' }));
    const uniequipTable = JSON.parse(readFileSync(uniequipPath, { encoding: 'utf-8' }));
    const subProfDict = uniequipTable.subProfDict as { [key: string]: { subProfessionName: string } };
    characterMap.clear();
    for (const key in gachaTable) {
      gachaTable[key] = [];
    }
    for (const id in characterPatch.patchChars) {
      characterTable[id] = characterPatch.patchChars[id]
    }
    for (const id in characterTable) {
      const char: Character = characterTable[id];
      char.character = id;
      if (subProfDict[char.subProfessionId]) {
        char.subProfessionName = subProfDict[char.subProfessionId].subProfessionName;
      }
      characterMap.set(id, char);
      if (characterIdMap.has(char.name)) {
        const old = characterIdMap.get(char.name);
        if (Array.isArray(old)) old.push(id);
        else characterIdMap.set(char.name, [old, id]);
      } else {
        characterIdMap.set(char.name, id);
      }
      if (char.itemObtainApproach && char.itemObtainApproach === '????????????' && char.teamId !== 'rainbow') {
        if (gachaTable[char.rarity]) gachaTable[char.rarity].push(char);
        else gachaTable[char.rarity] = [char];
      }
    }
  } catch (e) {
    return;
  }
};
[charTablePath, charPatchPath, uniequipPath].forEach(p => watchFile(p, resolveCharacterList));
resolveCharacterList();
export const getGachaCharacterTable = () => {
  return gachaTable;
};

const generatePng = async (char: Character) => {
  // Reusing old png file if possible
  const md5 = await getMd5(JSON.stringify(char));
  const dist = resolve(tmpDir, `${char.character}_${md5}.png`);
  if (existsSync(dist)) {
    const mtime = statSync(dist).mtime;
    // console.log('Dist file existed.', dist, mtime);
    // If file is not out of date, reuse it first
    if (mtime.valueOf() > Date.now() - 5 * 60 * 1000) return dist;
    else rmSync(dist);
  }
  try {
    await drawImage('character', char, dist);
    return dist;
  } catch (e) {
    console.log(`[Character] Error generating image: ${e.message || e}`);
    return null;
  }
};

const searchCharacter = new Component('searchCharacter', [{
  rules: [({ msg, groupId, config }) => {
    if (isNaN(parseInt(msg))) return false;
    if (!config.query || !config.query.enable) return false;
    const searched = searchMap.get(groupId);
    if (!searched) return false;
    if (!config.query) config.query = { timeout: 60_000, max: 30 };
    if (!config.query.timeout || config.query.timeout < 60_000) {
      config.query.timeout = 60_000;
    }
    if (!config.query.max || config.query.max < 5) {
      config.query.max = 5;
    }
    if (searched.timestamp + config.query.timeout < Date.now()) return false;
    const index = parseInt(msg);
    if (searched.characters.length < index) return false;
    return true;
  }],
  async handler ({ msg, message, bot, groupId, senderId, isGroup, reply }) {
    const id = isGroup ? groupId : senderId;
    const searched = searchMap.get(id);
    const index = parseInt(msg);
    const char = searched.characters[index - 1];
    if (!char) return reply('????????????');
    const file = await generatePng(char);
    if (file && existsSync(file)) {
      return bot.sendImageMessage(file, message);
    }
    else return reply('????????????');
  },
}, {
  rules: [/^??????/],
  command: true,
  async handler ({ cmd, groupId, senderId, isGroup, message, bot, config, reply, quoteReply }) {
    const query = cmd.replace(/^??????/, '').trim();
    if (!query.length) {
      return quoteReply('???????????????????????????');
    }
    if (!characterMap.size) {
      resolveCharacterList();
      if (!characterMap.size) return quoteReply('?????????????????????????????????????????????????????????');
    }
    const id = isGroup ? groupId : senderId;
    searchMap.delete(id);
    const gotNames: string[] = [];
    for (const name of characterIdMap.keys()) {
      // ?????????????????????
      if (name.includes(query)) gotNames.push(name);
    }
    if (!gotNames.length) {
      for (const name of characterIdMap.keys()) {
        // ?????????????????????
        if (query.includes(name)) gotNames.push(name);
      }
    }
    const gotChars: Character[] = [];
    gotNames.forEach(name => {
      const idOrArr = characterIdMap.get(name);
      if (Array.isArray(idOrArr)) {
        for (const id of idOrArr) {
          const char = characterMap.get(id);
          if (char.subProfessionName && !char.name.includes(char.subProfessionName)) {
            char.name += ` [${char.subProfessionName}]`;
          }
          gotChars.push(char);
        }
      } else {
        gotChars.push(characterMap.get(idOrArr));
      }
    });
    if (gotChars.length === 0) {
      return quoteReply(`??????????????? [${query}] ?????????`);
    }
    if (gotChars.length > config.query.max) {
      gotChars.splice(config.query.max);
    }
    if (gotChars.length === 1) {
      const file = await generatePng(gotChars[0]);
      if (file && existsSync(file)) return bot.sendImageMessage(file, message);
      else return reply('????????????');
    } else {
      searchMap.set(id, {
        timestamp: Date.now(),
        characters: gotChars,
      });
      let results = '??????????????????\n', index = 1;
      for (const char of gotChars) {
        results += `  ${index++}. ${char.name}\n`;
      }
      results += `?????????????????????????????????????????? ${Math.ceil(config.query.timeout / 1000)} ???`
      return reply(results);
    }
  },
}], true);

export default searchCharacter;
