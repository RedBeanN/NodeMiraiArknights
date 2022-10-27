import { resolve } from 'path';
import sharp from 'sharp';
import { assets } from '../root';
const fontfile = resolve(assets, 'sarasa-bd.ttf');
const font = 'Sarasa Term SC Bold';

export default async function textPng (config: {
  text: string | { value: string, color: string }[],
  fontSize?: number,
  color?: string,
  align?: 'left'|'center'|'right',
  width?: number,
} | string) {
  const { text, fontSize, color, width, align } = typeof config === 'string' ? {
    text: config,
    fontSize: 16,
    color: '#000',
    width: 720,
    align: 'left'
  } : {
    text: config.text || ' ',
    fontSize: config.fontSize || 16,
    color: config.color || '#000',
    width: config.width || 720,
    align: config.align || 'left',
  };
  const texts = typeof text === 'string' ? [{ value: text, color }] : text
  let colorText = `<span color="${color}" size="${fontSize}pt" line-height="${fontSize}pt">`;
  const mainColor = color;
  for (const { color, value } of texts) {
    if (color === mainColor) colorText += value;
    else {
      colorText += `<span color="${color}">${value}</span>`
    }
  }
  colorText += '</span>'
  const png = sharp({
    text: {
      text: colorText,
      width, align,
      dpi: 72, justify: true, rgba: true,
      fontfile, font,
    }
  });
  const meta = await png.metadata();
  const buffer = await png.png().toBuffer();
  return {
    buffer,
    width: meta.width,
    height: meta.height,
  };
}
