const { resolve } = require('path')
const T2S = require('text-to-svg')
const { assets } = require('../root')

const t2s = T2S.loadSync(resolve(assets, 'sarasa-bd.ttf'));

interface SvgConfig {
  text: string,
  color?: string,
  fontSize?: number
}
interface SvgObject {
  svg: string,
  width: number,
  height: number
}
export default function toSvg (config: SvgConfig | string): SvgObject {
  const { text, fontSize, color } = typeof config === 'string' ? {
    text: config,
    fontSize: 16,
    color: '#000'
  } : {
    text: config.text || ' ',
    fontSize: config.fontSize || 16,
    color: config.color || '#000'
  }
  const svg = t2s.getSVG(text, {
    x: 0,
    y: 0,
    fontSize,
    anchor: 'top',
    attributes: {
      fill: color,
    },
  });
  const widthStr = svg.match(/width="(.*?)"/)?.[1] || fontSize * text.length;
  const heightStr = svg.match(/height="(.*?)"/)?.[1] || fontSize;
  const width = Math.ceil(Number(widthStr));
  const height = Math.ceil(Number(heightStr));
  return { width, height, svg };
}
