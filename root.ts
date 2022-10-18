import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
export const root = resolve(process.cwd(), 'node_modules/.node-mirai-arknights');
export const statics = resolve(root, 'data/statics')
if (!existsSync(statics)) mkdirSync(statics, { recursive: true })
export const tmpDir = resolve(root, 'tmp');
if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

// import assetsDir from './assets';
// export const assets = resolve(__dirname, 'assets')
let baseDir = __dirname;
if (!existsSync(resolve(baseDir, 'assets/_arknights_assets_'))) {
  if (existsSync(resolve(baseDir, '../assets/_arknights_assets_'))) {
    baseDir = resolve(baseDir, '..');
  }
}
export const assets = resolve(baseDir, 'assets');
export const dist = resolve(baseDir, 'dist');
if (!existsSync(assets)) {
  throw new Error('Cannot get assets directory. Try re-install.');
}
// if (!existsSync(assets)) mkdirSync(assets, { recursive: true })

export default {
  root,
  tmpDir,
  statics,
  assets
}
