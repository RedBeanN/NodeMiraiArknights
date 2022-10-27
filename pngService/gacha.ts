import { resolve } from 'path';
import sharp, { OverlayOptions } from 'sharp';
import { statics } from '../root';
import { Character } from '../src/types';
import textPng from '../utils/textPng';
import { nearlyWhite } from './constants';

const drawGacha = async (chars: Character[], dist: string) => {
  const draws: OverlayOptions[][] = await chars.reduce(async (p, char, index) => {
    const prev = await p
    if (!char) return prev;
    const bg = sharp(resolve(statics, `../assets/gacha/r${char.rarity}.png`)).resize(123);
    const res = [{
      input: await bg.clone().rotate(180).resize(123, 600)
        .composite([{
          input: Buffer.from([255, 255, 255, 64]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: 'dest-in'
        }]).blur(2).toBuffer(),
      left: 27 + index * 123,
      top: 122,
      premultiplied: true,
    }, {
      input: await bg.resize(123).toBuffer(),
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
  const watermark = await textPng({
    text: 'github.com/RedBeanN/NodeMiraiArknights',
    color: nearlyWhite,
    fontSize: 18,
  });
  draws.push([{
    input: watermark.buffer,
    left: Math.floor((1280 - watermark.width) / 2),
    top: 694,
  }]);
  await sharp(resolve(statics, '../assets/gacha/background.png')).composite(draws.flat()).toFile(dist);
  return dist;
};

export default drawGacha;
