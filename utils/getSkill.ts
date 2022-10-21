import { existsSync, readFileSync, watchFile } from 'fs';
import { resolve } from 'path';
import { statics } from '../root';
import { Skill } from '../src/types';

const skills = new Map<string, Skill>();

const skillTablePath = resolve(statics, 'gamedata/excel/skill_table.json');
export const updateSkills = () => {
  if (!existsSync(skillTablePath)) return;
  try {
    const table = JSON.parse(readFileSync(skillTablePath, { encoding: 'utf-8' })) as { [key: string]: Skill };
    for (const skillName in table) {
      const skill = table[skillName];
      skills.set(skillName, skill);
    }
  } catch (e) {
    return;
  }
};
updateSkills();
watchFile(skillTablePath, updateSkills);

export default function getSkill (name: string) {
  return skills.get(name);
}
