const parallel = <T, K>(arr: T[], fn: (arg: T) => Promise<K>, max: number = 5) => new Promise<K[]>(res => {
  let ctr = 0;
  let cur = 0;
  let total = 0;
  const results: K[] = new Array(arr.length);
  const next = async () => {
    if (arr[cur]) {
      const result = await fn(arr[cur])
      results[cur] = result;
      total += 1;
      if (total === arr.length) res(results);
      next()
    } else {
      ctr--;
      if (ctr === 0) return res(results);
    }
    cur++;
  };
  for (let i = 0; i < max; i++) {
    ctr++;
    if (arr[cur]) {
      fn(arr[cur]).then(result => {
        results[cur] = result;
        total += 1;
        if (total === arr.length) res(results);
      }).then(next);
    } else {
      ctr--;
      if (ctr === 0) return res(results);
    }
    cur++;
  }
});

export default parallel;
