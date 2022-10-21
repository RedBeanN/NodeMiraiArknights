export default function textToArray (text: string, lineCount = 19): string[] {
  const regStr = `(([^\x00-\xff]|[\x00-\xff][\x00-\xff]|[\x00-\xff]){${lineCount}})`;
  const reg = new RegExp(regStr, 'g')
  return text.split('\n').map(str => {
    return str.replace(reg, (t, i) => {
      return t + '\n';
    });
  }).join('\n').split('\n').filter(i => i);
}
