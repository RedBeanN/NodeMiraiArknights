import character from './character';
// import { assets } from '../root';

const done = () => process.exit(0);
const error = () => process.exit(1);

if (process.argv.length > 2) {
  const ag = process.argv;
  const isDev = ag.includes('--dev');
  switch (ag[2]) {
    case 'character':
      console.log(ag[4]);
      character(JSON.parse(ag[3]), ag[4], isDev).then(r => {
        console.log(r);
      }).then(done).catch(e => {
        console.error(e);
        error();
      });
      break;
    default:
      console.log('Arguments error');
      done();
  }
} else {
  console.log(`This is a png generator for node-mirai-arknights.`);
  // console.log(assets);
  done();
}
