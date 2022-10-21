export default function uniqueBy<T extends any> (arr: T[], key: keyof T, fromTail: boolean = false) {
  const items = [...arr];
  if (fromTail) items.reverse();
  const added: T[keyof T][] = []
  const filtered = items.filter(item => {
    const id = item[key];
    if (added.includes(id)) return false;
    added.push(id);
    return true;
  });
  if (fromTail) filtered.reverse();
  return filtered;
}
