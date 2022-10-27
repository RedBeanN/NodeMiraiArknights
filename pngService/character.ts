import sharp, { OverlayOptions } from 'sharp';
// import toSvg from '../utils/toSvg';

import { Character } from '../src/types'
import { blue, dark, deepGray, extraLight, gray, light, nearlyWhite, white, xs, sm, md, lg, xl, xxl } from './constants';
import mapColorText from '../utils/mapColorText';
import { resolve } from 'path';
import { assets, statics } from '../root';
import { existsSync } from 'fs';
import getSkill from '../utils/getSkill';
import applyDescParams from '../utils/applyDescParams';
import uniqueBy from '../utils/uniqueBy';
import getRange from '../utils/getRange';
import { parseSkillSp } from '../utils/parseSkillSp';
import { getRangeMatrix } from '../utils/getRangeMatrix';
import getSkin from '../utils/getSkin';
import textPng from '../utils/textPng';

const imageWidth = 720;
const pl = (width: number) => {
  return Math.floor((imageWidth - width) / 2);
};
// const watermarkLeft = pl(watermarkObj.width);
// const watermark = Buffer.from(watermarkObj.svg);

type DrawPart = (
  data: Character,
  draw: (...items: OverlayOptions[]) => number,
  /** 将 `imageHeight` 下移 */
  move: (h: number) => void,
  getHeight: () => number,
) => Promise<any>;

/**
 * 绘制带颜色的各种描述, 从 `x` 和 `y` 偏移画起, 使用 `fontSize` 字号(每行
 * 字数已由 `mapColorText` 决定)
 */
const drawDescs = async ({
  descs, draw,
  x = 24,
  y = 0,
  fontSize = md,
}: {
  descs: { value: string, color: string }[][],
  draw: (...items: OverlayOptions[]) => number,
  x?: number,
  y?: number,
  fontSize?: number,
}) => {
  let deltaY = 0;
  for (const row of descs) {
    const { buffer } = await textPng({
      text: row,
      fontSize,
    })
    draw({
      input: buffer,
      left: x,
      top: y + deltaY,
    })
    deltaY += fontSize + 4;
  }
  return deltaY;
};

/**
 * 绘制头图, `getSkin` 会返回随机的皮肤
 */
const drawAvatar: DrawPart = async (data, draw, move, gh) => {
  const skinConf = getSkin(data.character);
  // console.log(skinConf)
  let skinPath = resolve(statics, `skin/${data.character}_2b.png`);
  if (skinConf) {
    const portrait = resolve(statics, `skin/${skinConf.portraitId}b.png`)
    if (existsSync(portrait)) skinPath = portrait;
  }
  if (!existsSync(skinPath)) {
    skinPath = resolve(statics, `skin/${data.character}_1b.png`);
  }
  if (existsSync(skinPath)) {
    let { data: buffer, info } = await sharp(skinPath).resize(imageWidth).trim().toBuffer({ resolveWithObject: true });
    // width should be 720 here
    let { width, height } = info;
    if ( width < height ) {
      // Ensure width and height both < 720
      const { info, data } = await sharp(skinPath).resize(undefined, imageWidth).trim().toBuffer({ resolveWithObject: true });
      width = info.width;
      height = info.height;
      buffer = data;
    }
    draw({
      input: buffer,
      left: pl(width),
      top: gh(),
    });
    move(height);
    if (skinConf && skinConf.displaySkin.drawerName) {
      const illus = await textPng({
        text: 'Illust: ' + skinConf.displaySkin.drawerName,
        fontSize: xs,
        color: extraLight,
      });
      let textWidth = illus.width;
      if (skinConf.displaySkin.skinName) {
        const skinName = await textPng({
          text: `「${skinConf.displaySkin.skinName}」`,
          fontSize: xs,
          color: extraLight,
        });
        if (textWidth < skinName.width) textWidth = skinName.width;
        draw({
          input: skinName.buffer,
          left: 696 - skinName.width - Math.floor((textWidth - skinName.width) / 2),
          top: gh() - 56,
        });
      }
      draw({
        input: illus.buffer,
        left: 696 - illus.width - Math.floor((textWidth - illus.width) / 2),
        top: gh() - 32,
      });
    }
  }
  const avatarPath = resolve(statics, `avatar/${data.character}.png`);
  if (existsSync(avatarPath)) {
    const avatar = sharp(avatarPath).resize(192, 192, { fit: 'contain' });
    draw({
      input: await avatar.toBuffer(),
      left: 12,
      top: gh(),
    });
  }
  return 192;
};

/**
 * 绘制头像旁的信息, 职业/星级/标签/特性/描述
 */
const drawHeaders: DrawPart = async (data, draw, move, gh) => {
  let deltaX = 0, deltaY = 0;
  if (data.profession) {
    const profIcon = resolve(statics, `../assets/professions/${data.profession}.png`);
    if (existsSync(profIcon)) {
      const icon = sharp(profIcon).resize(32, 32, { fit: 'contain', background: '#0000' });
      draw({
        input: {
          create: {
            width: 36,
            height: 36,
            channels: 3,
            background: gray,
          }
        },
        left: 218,
        top: gh() + deltaY + 2,
      }, {
        input: await icon.toBuffer(),
        left: 220,
        top: gh() + deltaY + 4,
      });
      deltaX += 40;
    } else {
      console.log('Prof icon not found', profIcon)
    }
  }
  if ('rarity' in data) {
    const { width, buffer } = await textPng({
      text: '★'.repeat(data.rarity + 1),
      color: extraLight,
      fontSize: xxl,
    })
    draw({
      input: buffer,
      left: 220 + deltaX,
      top: gh() + deltaY + 8,
    });
    deltaY += 4;
    deltaX += width - 40;
  }
  const tags = [data.itemObtainApproach, ...(data.tagList || [])].filter(i => i);
  for (const text of tags) {
    const { buffer, width, height } = await textPng({ text, color: dark, fontSize: md });
    const bg = sharp({
      create: {
        width: width + 8,
        height: height + 8,
        channels: 3,
        background: text === data.itemObtainApproach ? white : extraLight,
      },
    }).png().toBuffer();
    if ((270 + deltaX + width) > 700) {
      deltaX = -50;
      deltaY += (md + 16);
    }
    draw({
      input: await bg,
      left: 270 + deltaX,
      top: gh() + deltaY,
    }, {
      input: buffer,
      left: 274 + deltaX,
      top: gh() + deltaY + 4,
    });
    deltaX += (width + 16);
  }
  deltaY += (lg + 12);
  // Descriptions
  if (data.description && data.description.length) {
    let dy = 0;
    if (data.subProfessionId) {
      const profIcon = resolve(statics, `../assets/professions/${data.subProfessionId}.png`);
      if (existsSync(profIcon)) {
        const icon = sharp(profIcon).resize(28, 28, { fit: 'contain', background: '#0000' });
        draw({
          input: {
            create: { width: 36, height: 36, channels: 3, background: gray }
          },
          left: 218,
          top: gh() + deltaY + 8,
        }, {
          input: {
            create: { width: 32, height: 32, channels: 3, background: '#000' }
          },
          left: 220,
          top: gh() + deltaY + 10,
        }, {
          input: await icon.png().toBuffer(),
          left: 222,
          top: gh() + deltaY + 12,
        });
        dy += 2;
      }
    }
    const dx = dy ? 42 : 0;
    let desc = data.description
    if (data.trait && data.trait.candidates && data.trait.candidates.length) {
      data.trait.candidates.forEach(can => {
        if (can.overrideDescripton) {
          desc = can.overrideDescripton;
          if (can.blackboard) {
            desc = applyDescParams(desc, can.blackboard);
          }
        }
      })
    }
    const descs = mapColorText(desc, dy ? 36 : 38);
    const descY = descs.length === 1 ? 10 : 0;
    const descHeight = await drawDescs({ descs, draw, x: 220 + dx, y: gh() + deltaY + dy + descY });
    deltaY += Math.max(48, descHeight) + 4;
  }
  if (data.itemUsage) {
    const descs = mapColorText(data.itemUsage, 40).map(row => row.map(item => {
      item.color = nearlyWhite
      return item
    }));
    const descHeight = await drawDescs({ descs, draw, x: 220, y: gh() + deltaY + 4 }) + 8;
    deltaY += descHeight;
  }
  return deltaY;
};

/**
 * 绘制各阶段属性
 */
const drawAttrs: DrawPart = async (data, draw, move, gh) => {
  if (!data.phases || !data.phases.length) return 0;
  const { width: titleWidth, buffer: titleBuffer } = await textPng({
    text: '属性',
    fontSize: lg,
    color: white
  });
  draw({
    input: titleBuffer,
    left: Math.floor((720 - titleWidth) / 2),
    top: gh() + xs,
  });
  move(xl);
  let dy = gh() + 24;
  let lineColor = nearlyWhite;
  let widths = new Array(9).fill(144)
  const drawLine = async (
    tag: string, hp: string, atk: string, def: string, mdef: string,
    respawn: string, block: string, cost: string, atkTime: string,
  ) => {
    const cols = [tag, hp, atk, def, mdef, respawn, block, cost, atkTime];
    for (let i = 0; i < cols.length; i++) {
      const color = i ? lineColor : nearlyWhite;
      const { width, buffer, height } = await textPng({ text: cols[i], fontSize: sm, color });
      if ((widths[i] > width + 24) && widths[i] === 144) widths[i] = width + 24;
      const deltaX = widths.slice(0, i).reduce((p, a) => p + a, 32);
      draw({
        input: buffer,
        left: Math.floor(deltaX + (widths[i] - width) / 2),
        top: dy - Math.floor(height / 2),
      });
    }
    dy += lg;
  };
  await drawLine('  阶段  ', '生命上限', '攻击', '防御', '法抗', '再部署', '阻挡', '费用', '攻击间隔');
  lineColor = blue;
  const getAttrs = (kf: Character['phases']['0']['attributesKeyFrames']['0']['data']) => {
    return {
      hp: kf.maxHp.toString(),
      atk: kf.atk.toString(),
      def: kf.def.toString(),
      mdef: kf.magicResistance.toString(),
      respawn: kf.respawnTime.toString() + 's',
      block: kf.blockCnt.toString(),
      cost: kf.cost.toString(),
      atkTime: kf.baseAttackTime.toString() + 's',
    }
  }
  for (let i = 0; i < data.phases.length; i++) {
    const phase = data.phases[i];
    const stage = i === 0 ? '满级' : i === 1 ? '精1满级' : '精2满级';
    if (i === 0) {
      const { hp, atk, def, mdef, respawn, block, cost, atkTime } = getAttrs(phase.attributesKeyFrames[0].data);
      await drawLine('初始', hp, atk, def, mdef, respawn, block, cost, atkTime)
    }
    const { hp, atk, def, mdef, respawn, block, cost, atkTime } = getAttrs(phase.attributesKeyFrames[phase.attributesKeyFrames.length - 1].data);
    await drawLine(stage, hp, atk, def, mdef, respawn, block, cost, atkTime);
  }
  dy += sm;
  move(dy - gh());
  return dy;
};

/**
 * 绘制各阶段攻击范围
 */
const drawRanges: DrawPart = async (data, draw, move, gh) => {
  if (!data.phases || !data.phases.length) return
  const squareSize = 24;
  // move(sm);
  const { width: titleWidth, buffer: titleBuffer } = await textPng({
    text: '攻击范围',
    fontSize: lg,
    color: white
  });
  draw({
    input: titleBuffer,
    left: Math.floor((720 - titleWidth) / 2),
    top: gh() - xs,
  });
  move(xl);
  const grids: Array<{
    top: number,
    left: number,
    matrix: number[][],
  }> = [];
  let minTop = 0, minLeft = 0, maxRight = 0, maxBottom = 0;
  for (const phase of data.phases) {
    if (!phase.rangeId) continue;
    const range = getRange(phase.rangeId);
    const { left, top, right, bottom, matrix } = getRangeMatrix(range);
    grids.push({ top, left, matrix });
    if (minTop > top) minTop = top;
    if (minLeft > left) minLeft = left;
    if (maxRight < right) maxRight = right;
    if (maxBottom < bottom) maxBottom = bottom;
  }
  const finalGrids: number[][][] = []
  for (const g of grids) {
    const grid: number[][] = [];
    const pt = g.top - minTop;
    const pl = g.left - minLeft;
    for (let i = 0; i < pt; i++) grid.push([])
    for (const row of g.matrix) {
      for (let i = 0; i < pl; i++) row.unshift(0);
      grid.push(row);
    }
    finalGrids.push(grid);
  }
  const cols = maxRight - minLeft;
  const colsWidth = (cols + 1) * (squareSize + 2) * finalGrids.length
  const midWidth = (finalGrids.length - 1) * (squareSize * 2 + 2 + lg / 2)
  const padding = Math.floor((imageWidth - colsWidth - midWidth) / 2)
  for (let i = 0; i <= maxBottom - minTop; i++) {
    const len = maxRight - minLeft;
    let drawed = 0;
    for (const index in finalGrids) {
      const grid = finalGrids[index]
      for (let j = 0; j <= len; j++) {
        const isSelf = (i + minTop === 0) && (j + minLeft === 0);
        const background = isSelf ? blue : grid[i] && grid[i][j] ? light : deepGray;
        draw({
          input: {
            create: {
              width: squareSize, height: squareSize,
              channels: 3, background,
            }
          },
          left: padding + drawed * (squareSize + 2),
          top: gh() + i * (squareSize + 2),
        })
        drawed++;
      }
      drawed++;
      if (Number(index) < finalGrids.length - 1) draw({
        input: (await textPng({
          text: '→',
          fontSize: xl,
          color: blue,
        })).buffer,
        left: padding + drawed * (squareSize + 2),
        top: gh() - minTop * (squareSize + 2) - (lg / 2) + 4
      })
      drawed += 2;
    }
  }
  move((maxBottom - minTop) * (squareSize + 2) + 40);
};

/**
 * 绘制技能(满级+专3)
 */
const drawSkills: DrawPart = async (data, draw, move, gh) => {
  if (!data.skills || !data.skills.length) return 0;
  let deltaY = 0;
  draw({
    input: (await textPng({
      text: '技能',
      fontSize: lg,
      color: white
    })).buffer,
    left: 48,
    top: gh(),
  });
  deltaY += xs;
  for (const skillItem of data.skills) {
    const skillId = skillItem.skillId;
    const skill = getSkill(skillId);
    if (!skill || !skill.levels) continue;
    const iconId = skill.iconId || skill.skillId;
    const iconPath = resolve(statics, `skill/skill_icon_${iconId}.png`);
    const drawedIcon = existsSync(iconPath);
    let leftHeight = drawedIcon ? 90 : 0;
    if (drawedIcon) {
      const icon = sharp(iconPath).resize(112);
      draw({
        input: await icon.toBuffer(),
        left: 24,
        top: gh() + deltaY + md + 16,
      });
    }
    let dy = 0;
    const levels = [skill.levels[6], skill.levels[9]].map((i, index) => {
      if (!i) return null;
      i.name = `${index ? '[专3]': i.name + ' [满级]'}`;
      return i;
    }).filter(i => i);
    await levels.reduce(async (prev, level, index) => {
      await prev
      // const level = skill.levels.pop();
      const descRaw = applyDescParams(level.description, level.blackboard);
      const { tags, description: spStr } = parseSkillSp(level);
      if (index === levels.length - 1) {
        tags.reduce(async (prev, tag) => {
          await prev;
          const { width, height, buffer } = await textPng({
            text: tag.value,
            fontSize: sm,
            color: white,
          });
          const left = Math.floor((160 - width) / 2);
          const top = Math.floor(gh() + deltaY + sm + leftHeight + 12);
          draw({
            input: {
              create: {
                width: width + 16, height: height + 8,
                channels: 3, background: tag.color,
              }
            },
            left: left - 8, top: top - 4,
          }, { input: buffer, left, top });
          leftHeight += height + 12;
        }, Promise.resolve());
        if (level.rangeId && getRange(level.rangeId)) {
          const range = getRange(level.rangeId);
          const { top, left, right, bottom, matrix } = getRangeMatrix(range);
          const width = (right - left + 1) * 18;
          const height = (bottom - top + 1) * 18;
          const pl = Math.floor((160 - width) / 2);
          for (let i = top; i <= bottom; i++) {
            const di = i - top;
            for (let j = left; j <= right; j++) {
              const dj = j - left;
              const sq = i === 0 && j === 0 ? blue : matrix[di]?.[dj] ? light : deepGray;
              draw({
                input: { create: { width: 16, height: 16, channels: 3, background: sq } },
                left: pl + (dj * 18),
                top: Math.floor(gh() + deltaY + leftHeight + di * 18 + 56)
              })
            }
          }
          leftHeight += height;
        }
        leftHeight += 48;
      }
      const descs = mapColorText(spStr + descRaw, 44);
      descs.unshift([{
        value: level.name,
        color: nearlyWhite,
      }])
      dy += await drawDescs({ descs, draw, x: 160, y: gh() + deltaY + dy + md + 4 }) + 8;
    }, Promise.resolve())
    if (drawedIcon && dy < leftHeight) dy = leftHeight - 16;
    deltaY += dy + 8;
  }
  move(deltaY + 36);
};

/**
 * 潜能, 纯文本
 */
const drawPotentials: DrawPart = async (data, draw, move, gh) => {
  let deltaY = 0;
  draw({
    input: (await textPng({
      text: '潜能' + (data.potentialRanks.length ? '' : '(无)'),
      fontSize: lg,
      color: white
    })).buffer,
    left: 56,
    top: gh(),
  });
  deltaY += lg + 16;
  for (const pot of data.potentialRanks) {
    const descs = mapColorText('- ' + pot.description, 20);
    deltaY += await drawDescs({ descs, draw, x: 36, y: gh() + deltaY }) + 12;
  }
  return deltaY;
};

/**
 * 天赋
 */
const drawTalents: DrawPart = async (data, draw, move, gh) => {
  let deltaY = 0;
  draw({
    input: (await textPng({
      text: '天赋' + (!data.talents || !data.talents.length ? '(无)' : '') ,
      fontSize: lg,
      color: white
    })).buffer,
    left: 308,
    top: gh(),
  });
  deltaY += lg + 16;
  if (!data.talents || !data.talents.length) return deltaY;
  for (const { candidates } of data.talents) {
    for (const talent of uniqueBy(candidates, 'prefabKey', true)) {
      draw({
        input: (await textPng({
          text: talent.name || '-',
          fontSize: md,
          color: nearlyWhite,
        })).buffer,
        left: 288,
        top: gh() + deltaY,
      });
      deltaY += (md + 8);
      const descs = mapColorText(talent.description || '-', 34);
      deltaY += await drawDescs({ descs, draw, x: 288, y: gh() + deltaY }) + 12;
    }
  }
  return deltaY;
};

export default async function character (data: Character, dist: string, log: boolean = false) {
  const debug = (...args: any[]) => log && console.log(...args);
  const compositeGroup: OverlayOptions[] = [];
  const draw = (...items: OverlayOptions[]) => compositeGroup.push(...items);

  let imageHeight = 16;
  const move = (height: number) => (imageHeight += (height + 4));
  const getHeight = () => imageHeight;

  const name = await textPng({
    text: data.name,
    color: white,
    fontSize: xl,
    align: 'center',
  });
  draw({
    input: name.buffer,
    left: pl(name.width),
    top: imageHeight,
  });
  move(name.height + 12);
  debug(`${name.width}x${name.height} ${data.name}`);

  move(Math.max(
    await drawAvatar(data, draw, move, getHeight),
    await drawHeaders(data, draw, move, getHeight),
  ));
  debug(`Avatar: ${data.character}`);
  debug(`Tags: ${data.itemObtainApproach},${data.tagList}`);

  await drawAttrs(data, draw, move, getHeight);
  debug('Attrs');

  await drawRanges(data, draw, move, getHeight);
  debug(`Ranges: ${data.phases.length}`);

  await drawSkills(data, draw, move, getHeight);
  debug(`Skills: ${data.skills.length}`);

  move(Math.max(
    await drawPotentials(data, draw, move, getHeight),
    await drawTalents(data, draw, move, getHeight),
  ));
  debug(`Talents: ${data.talents && data.talents[0].candidates.length}`);

  const watermarkObj = textPng({
    text: 'github.com/RedBeanN/NodeMiraiArknights',
    color: nearlyWhite,
    fontSize: sm,
  });
  const wm = await watermarkObj;
  draw({
    input: wm.buffer,
    left: pl(wm.width),
    top: getHeight(),
  });
  move(16);

  const image = sharp({
    create: {
      width: imageWidth,
      height: getHeight() + 16,
      channels: 3, // 3: sRGB, 4: CMYK
      background: dark,
    },
  });
  image.composite(compositeGroup);
  image.toFile(dist).then(() => {
    image.destroy();
    compositeGroup.splice(0);
  });
  return;
}
