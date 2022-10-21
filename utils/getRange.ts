import { existsSync, readFileSync, watchFile } from 'fs';
import { resolve } from 'path';
import { statics } from '../root';

export interface Range {
  id: string,
  direction: number,
  grids: { row: number, col: number }[]
}

const ranges = new Map<string, Range>();

const rangeTablePath = resolve(statics, 'gamedata/excel/range_table.json');
export const updateRanges = () => {
  if (!existsSync(rangeTablePath)) return;
  try {
    const table = JSON.parse(readFileSync(rangeTablePath, { encoding: 'utf-8' })) as { [key: string]: Range };
    ranges.clear();
    for (const rangeId in table) {
      const range = table[rangeId];
      ranges.set(rangeId, range);
    }
  } catch (e) {
    return;
  }
};
updateRanges();
watchFile(rangeTablePath, updateRanges);

export default function getRange (id: string) {
  return ranges.get(id);
}
