import axios from 'axios';
import { existsSync, mkdirSync, createWriteStream, ReadStream } from 'fs';
import { dirname } from 'path';

const download = async (url: string, dist: string, overwrite = false) => {
  if (existsSync(dist) && !overwrite) return 0;
  const dir = dirname(dist);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return new Promise<number>(async (resolve, reject) => {
    let retries = 0;
    let run = true;
    let size = 0;
    while (run) {
      try {
        const { data } = await axios<ReadStream>({
          url,
          method: 'GET',
          responseType: 'stream',
        })
        const stream = createWriteStream(dist)
        data.pipe(stream)
        let totalSize = 0;
        size = await new Promise<number>((res, rej) => {
          data.on('data', chunk => {
            totalSize += chunk.length;
          });
          data.on('end', () => {
            run = false;
            res(totalSize);
          })
          data.on('error', e => {
            retries++;
            rej(e);
          })
        })
      } catch (e) {
        retries++;
        // console.log(`Retry for ${retries} time ${url}`);
        if (retries > 5) {
          run = false
          reject(e)
        };
      }
    }
    resolve(size);
  })
};

export default download;
