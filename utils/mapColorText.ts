import { blue, extraLight, green, red } from '../pngService/constants';
import richColors from './richColors';

const getTagColor = (tag: string) => {
  if (richColors[tag.substring(1)]) {
    return richColors[tag.substring(1)];
  }
  switch (tag) {
    case '$ba.stun':
      return red;
    default:
      return blue;
  }
};

const walk = (str: string) => {
  const stack: Array<string> = [];
  const results: Array<{ value: string, type: 'text' | 'tag' }> = [];
  let type: 'text' | 'tag' = 'text';
  const TAG = '_TAG_'
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    switch (char) {
      case '<': {
        if (!['@', '$', '/'].includes(str[i + 1])) {
          stack.push(char);
          break
        } else {
          if (stack.includes(TAG)) {}
          const value = stack.splice(0).join('');
          if (value) results.push({ value, type })
          // else {
          //   console.log('cannot get value', stack, str, char)
          // }
          type = 'tag'
        }
        break;
      }
      case '>': {
        if (type === 'text') {
          stack.push(char);
          break;
        }
        const value = stack.splice(0).join('');
        if (value) results.push({ value, type });
        type = 'text';
        break;
      }
      default:
        stack.push(char);
    }
  }
  if (stack.length) {
    results.push({ value: stack.join(''), type })
  }
  // console.log(JSON.stringify(results, null, 2))
  const chars: Array<{ char: string, color: string }> = [];
  let color = extraLight, prevColors: string[] = [];
  for (const item of results) {
    if (item.type == 'text') {
      for (const char of item.value) {
        chars.push({ char, color })
      }
    } else if (item.type === 'tag') {
      if (item.value === '/') {
        prevColors.pop();
        color = prevColors.length ? prevColors.pop() : extraLight;
        if (prevColors[prevColors.length - 1] !== color) prevColors.push(color);
      } else {
        color = getTagColor(item.value);
        if (prevColors[prevColors.length - 1] !== color) prevColors.push(color);
      }
    }
  }
  // return chars;
  const colorful: Array<{ value: string, color: string }> = []
  chars.forEach(char => {
    const prev = colorful[colorful.length - 1]
    if (!prev) return colorful.push({
      value: char.char,
      color: char.color
    })
    if (prev.color === char.color) prev.value += char.char
    else colorful.push({
      value: char.char,
      color: char.color
    })
  })
  return colorful
}

export default function mapColorText (text: string, maxLength = 38) {
  const escaped = text.replace(/(<[@$\/][^/]*?>)|(<\/>)/g, '');
  const lines = walk(text.replace(/\n/g, ''));
  // console.log(escaped)
  const rows: { value: string; color: string; }[][] = [[]];
  let ctr = 0;
  let [l, p] = [0, 0];
  for (let i = 0; i < escaped.length; i++) {
    const char = escaped[i];
    const code = char.charCodeAt(0);
    if (ctr >= maxLength || escaped.substring(i).startsWith('\\n')) {
      rows.push([])
      ctr = 0
    }
    if (code < 255) ctr += 1;
    else ctr += 2;
    if (escaped.substring(i).startsWith('\\n')) ctr = 0
    const prevRow = rows[rows.length - 1] || [];
    const prev = prevRow[prevRow.length - 1] || { color: '', value: '' };
    if (lines[l] && lines[l].value[p] === char) {
      // Is same char
    } else {
      [l, p] = [l + 1, 0]
      if (!lines[l] || lines[l].value[p] !== char) {
        throw new Error(`Cannot map ${JSON.stringify(lines[l])} to ${char} of ${escaped} [${i}]`)
      }
    }
    if (!lines[l]) throw new Error('Line parse failed')
    const { color } = lines[l]
    if (color === prev.color) {
      if (!escaped.substring(i).startsWith('\\n')) {
        if (char !== 'n' || escaped[i - 1] !== '\\') prev.value += char;
        else ctr--;
      }
    } else {
      prevRow.push({
        value: escaped.substring(i).startsWith('\\n') ? '' : char,
        color,
      });
    }
    // if (escaped.substring(i).startsWith('\\n')) i++
    p++
  }
  // console.log(rows)
  // return escaped
  return rows.map(r => r.filter(i => i.value))
}
