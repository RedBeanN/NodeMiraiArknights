export default function delay (time: number = 100) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}
