import { SkillLevel } from '../src/types';
import colors from './richColors'

export function parseSkillSp (skill: SkillLevel) {
  const tags: { color: string, value: string }[] = [];
  switch (skill.spData.spType) {
    case 1:
      tags.push({ color: colors['sp.auto'], value: '自动回复' }); break;
    case 2:
      tags.push({ color: colors['sp.atk'], value: '攻击回复' }); break;
  }
  switch (skill.skillType) {
    case 0:
      tags.push({ color: colors['sp.gray'], value: '被动' }); break;
    case 1:
      tags.push({ color: colors['sp.gray'], value: '手动触发' }); break;
    case 2:
      tags.push({ color: colors['sp.gray'], value: '自动触发' }); break;
  }
  let spStr = '<@vc.text>';
  if (skill.spData.spType) {
    spStr += `初始: <@ba.kw>${skill.spData.initSp}</> `;
    spStr += `消耗: <@ba.kw>${skill.spData.spCost}</> `;
    spStr += `回复: <@ba.kw>${skill.spData.increment}</> `;
  }
  if (skill.duration > 0) {
    spStr += `持续: <@ba.kw>${skill.duration}s</>`
  }
  // console.log(tags)
  return {
    tags,
    description: spStr + '\\n</>'
  }
}
