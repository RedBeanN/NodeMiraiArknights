import { createHash, randomBytes } from 'crypto';
import { createReadStream, existsSync, PathLike } from 'fs';

export default function getMd5 (file: PathLike | string) {
  return new Promise<string>(resolve => {
    const hash = createHash('md5');
    if (!existsSync(file)) {
      if (typeof file === 'string') {
        resolve(hash.update(file, 'utf-8').digest().toString('hex'));
      } else {
        resolve(randomBytes(12).toString('hex'))
      }
      return
    }
    const stream = createReadStream(file);
    stream.on('data', chunk => hash.update(chunk.toString('binary'), 'binary'));
    stream.on('end', () => {
      resolve(hash.digest().toString('hex'));
    });
    stream.on('error', () => resolve(randomBytes(12).toString('hex')))
  });
};
