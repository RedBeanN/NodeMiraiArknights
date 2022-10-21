import { existsSync, readFileSync, watchFile } from 'fs';
import { resolve } from 'path';
import { statics } from '../root';

interface Skin {
  skinId: string,
  charId: string,
  tokenSkinMap: string | null,
  illustId: string,
  dynIllustId: string | null,
  avatarId: string,
  portraitId: string,
  dynPortraitId: string | null,
  dynEntranceId: string | null,
  buildingId: string | null,
  battleSkin: {
    overwritePrefab: boolean,
    skinOrPrefabId: string | null
  },
  isBuySkin: boolean,
  tmplId: string | null,
  voiceId: string | null,
  voiceType: string,
  displaySkin: {
    skinName: string | null,
    colorList: string[],
    titleList: string[],
    modelName: string,
    drawerName: string,
    skinGroupId: string,
    skinGroupName: string,
    skinGroupSortIndex: number,
    content: string,
    dialog: string | null,
    usage: string | null,
    description: string | null,
    obtainApproach: string | null,
    sortId: number,
    displayTagId: string | null,
    getTime: number,
    onYear: number,
    onPeriod: number
  }
}
const skinTablePath = resolve(statics, 'gamedata/excel/skin_table.json');
const skinMap = new Map<string, Skin[]>();

export const updateSkins = () => {
  if (!existsSync(skinTablePath)) return;
  const skinTable: { [key: string]: Skin } = JSON.parse(readFileSync(skinTablePath, { encoding: 'utf-8' })).charSkins;
  for (const key in skinTable) {
    const skin = skinTable[key];
    const charId = skin.charId;
    if (!charId) continue;
    if (!skinMap.has(charId)) skinMap.set(charId, []);
    const skins = skinMap.get(charId);
    skins.push(skin);
    // skins.sort((a, b) => {
    //   if (!('sortId' in a.displaySkin)) return -1;
    //   if (!('sortId' in b.displaySkin)) return 1;
    //   return a.displaySkin.sortId - b.displaySkin.sortId;
    // });
  }
};
watchFile(skinTablePath, updateSkins);
updateSkins();

export default function getSkin (charId: string) {
  if (!skinMap.has(charId)) return null;
  const skins = skinMap.get(charId);
  if (skins.length) return skins[Math.floor(Math.random() * skins.length)];
  return null;
}
