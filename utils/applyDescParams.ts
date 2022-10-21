const applyDescParams = (desc: string, params: { key: string, value: number }[]) => {
  return desc.replace(/{(.+?)}/g, (_, t: string) => {
    let keyword = t;
    let format = (v: number) => v.toString();
    if (t.endsWith('0%') && t.includes(':')) {
      const [kw, p] = t.split(':');
      keyword = kw;
      format = (v: number) => {
        if (keyword.startsWith('-')) v = -v;
        if (p === '0%') return Math.floor(v * 100) + '%'
        if (p.includes('.')) {
          const fixed = p.split('.').pop().replace('%', '').length;
          if (fixed) return (v * 100).toFixed(fixed) + '%';
          return (v * 100) + '%';
        }
        return (v * 100) + '%'
      }
    }
    for (const { key, value } of params) {
      if (key.toLowerCase() === keyword.toLowerCase()) return format(value);
      if ('-' + key.toLowerCase() === keyword.toLowerCase()) return format(value);
    }
    return t
  })
}
export default applyDescParams;
