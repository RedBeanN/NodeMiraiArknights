import { spawn } from 'child_process';
import { resolve } from 'path';
import { dist } from '../root';
import { Character } from '../src/types';

export default function drawImage (type: 'character', data: Character, distPath: string): Promise<void>;
export default function drawImage (type: 'gacha', data: Character[], distPath: string): Promise<void>;
export default function drawImage (type: unknown, data: any, distPath: any) {
  if (type !== 'character' && type !== 'gacha') throw new Error('Unsupported type')
  return new Promise<void>((res, rej) => {
    const child = spawn('node', [
      resolve(dist, 'png.js'),
      type,
      JSON.stringify(data),
      distPath,
    ]);
    // child.stdout.on('data', chunk => console.log('d', chunk.toString()));
    // child.stderr.on('data', chunk => console.error('e', chunk.toString()));
    child.on('close', () => {
      // console.log('close', distPath, child.exitCode)
      if (child.exitCode === 0) res();
      else rej();
    });
  });
}
