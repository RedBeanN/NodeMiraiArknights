import { Range } from './getRange';

export function getRangeMatrix (range: Range) {
  const rangeMap = new Map<number, number[]>();
  let top = 0, right = 0, bottom = 0, left = 0;
  for (const { row, col } of range.grids) {
    if (top > row) top = row;
    if (left > col) left = col;
    if (bottom < row) bottom = row;
    if (right < col) right = col;
    if (!rangeMap.has(row)) rangeMap.set(row, []);
    const rowData = rangeMap.get(row);
    if (!rowData.includes(col)) rowData.push(col);
  }
  const matrix: number[][] = [];
  for (let i = top; i <= bottom; i++) {
    matrix[i - top] = [];
    const row = rangeMap.get(i);
    row.sort((a, b) => a - b);
    for (let j = left; j <= right; j++) {
      matrix[i - top][j - left] = row.includes(j) ? 1 : 0;
    }
  }
  return {
    left, top, right, bottom, matrix,
  };
}
