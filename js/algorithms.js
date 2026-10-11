// Ein Ereignis ist genau eine sichtbare Aktion. Ein Tausch schreibt zweimal.
export function compare(i, j, values) {
  return { type: 'compare', indices: [i, j], values, comparisons: 1, writes: 0 };
}
export function* swap(a, i, j) {
  if (i === j) return;
  [a[i], a[j]] = [a[j], a[i]];
  yield { type: 'swap', indices: [i, j], comparisons: 0, writes: 2 };
}
export function fixed(indices) { return { type: 'fixed', indices, comparisons: 0, writes: 0 }; }
export function write(a, i, value) {
  a[i] = value;
  return { type: 'write', indices: [i], comparisons: 0, writes: 1 };
}
export function* bubble(a) {
  for (let end = a.length - 1; end > 0; end--) {
    let changed = false;
    // Benachbarte Werte tauschen: der größte wandert nach rechts.
    for (let i = 0; i < end; i++) {
      yield compare(i, i + 1);
      if (a[i] > a[i + 1]) { yield* swap(a, i, i + 1); changed = true; }
    }
    yield fixed([end]);
    if (!changed) break;
  }
  yield fixed(Array.from(a.keys()));
}
export const algorithms = { bubble };
export function countEvent(totals, event) {
  totals.comparisons += event.comparisons || 0;
  totals.writes += event.writes || 0;
}
