const ps = (s: string | number) => {
  return s.toString().padStart(2, '0')
}
export default function datetime (date = new Date()) {
  const [Y, M, D] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const [h, m, s] = [date.getHours(), date.getMinutes(), date.getSeconds()].map(ps);
  return `${Y}-${ps(M)}-${ps(D)} ${h}:${m}:${s}`;
}
