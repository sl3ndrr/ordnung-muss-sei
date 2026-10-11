// Ein Ereignis ist genau eine sichtbare Aktion. Ein Tausch schreibt zweimal.
export function compare(i, j, values) {
  return { type: 'compare', indices: [i, j].filter(index => index !== null), values, comparisons: 1, writes: 0 };
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
export function* selection(a) {
  for (let start = 0; start < a.length - 1; start++) {
    let smallest = start;
    yield { type: 'pivot', indices: [smallest], values: [a[smallest]] };
    // Das Minimum im Rest suchen; danach nur einen Tausch durchführen.
    for (let j = start + 1; j < a.length; j++) {
      yield compare(smallest, j);
      if (a[j] < a[smallest]) {
        smallest = j; yield { type: 'pivot', indices: [smallest], values: [a[smallest]] };
      }
    }
    yield* swap(a, start, smallest); yield fixed([start]);
  }
  yield fixed(Array.from(a.keys()));
}
export function* insertion(a) {
  for (let i = 1; i < a.length; i++) {
    const key = a[i]; let j = i - 1;
    yield { type: 'pivot', indices: [i], values: [key] };
    // Links ist bereits eine geordnete Teilfolge. Platz für key schaffen.
    while (j >= 0) {
      yield compare(j, null, [a[j], key]);
      if (a[j] <= key) break;
      yield write(a, j + 1, a[j]); j--;
    }
    if (j + 1 !== i) yield write(a, j + 1, key);
  }
  // Der geordnete Präfix ist vorher noch nicht endgültig: neue Werte können davor landen.
  yield fixed(Array.from(a.keys()));
}
export function* merge(a) {
  function* part(lo, hi) {
    if (hi - lo < 2) return;
    const mid = Math.floor((lo + hi) / 2);
    yield* part(lo, mid); yield* part(mid, hi);
    const buffer = []; let left = lo, right = mid;
    // Zwei geordnete Hälften: jeweils den kleineren Kopf ins Hilfsfeld nehmen.
    while (left < mid && right < hi) {
      yield compare(left, right);
      const chosen = a[left] <= a[right] ? left++ : right++;
      buffer.push(a[chosen]);
      yield { type: 'auxiliary', indices: [chosen], writes: 1 };
    }
    while (left < mid) { buffer.push(a[left]); yield { type: 'auxiliary', indices: [left++], writes: 1 }; }
    while (right < hi) { buffer.push(a[right]); yield { type: 'auxiliary', indices: [right++], writes: 1 }; }
    for (let k = 0; k < buffer.length; k++) yield write(a, lo + k, buffer[k]);
  }
  yield* part(0, a.length); yield fixed(Array.from(a.keys()));
}
export function* quick(a) {
  function* part(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) { yield fixed([lo]); return; }
    const pivotIndex = Math.floor((lo + hi) / 2), pivot = a[pivotIndex];
    yield { type: 'pivot', indices: [pivotIndex], values: [pivot] };
    let less = lo, scan = lo, greater = hi;
    // Drei Bereiche: kleiner, gleich, größer. Gleiche Werte werden nicht erneut sortiert.
    while (scan <= greater) {
      yield compare(scan, null, [a[scan], pivot]);
      if (a[scan] < pivot) { yield* swap(a, less++, scan++); }
      else {
        yield compare(scan, null, [a[scan], pivot]);
        if (a[scan] > pivot) { yield* swap(a, scan, greater--); }
        else scan++;
      }
    }
    yield fixed(Array.from({ length: greater - less + 1 }, (_, i) => less + i));
    yield* part(lo, less - 1); yield* part(greater + 1, hi);
  }
  yield* part(0, a.length - 1);
}
export function* heap(a) {
  function* sift(root, end) {
    // Heap = Baum im Feld: Eltern sind mindestens so groß wie ihre Kinder.
    while (root * 2 + 1 < end) {
      let child = root * 2 + 1;
      if (child + 1 < end) { yield compare(child, child + 1); if (a[child] < a[child + 1]) child++; }
      yield compare(root, child);
      if (a[root] >= a[child]) return;
      yield* swap(a, root, child); root = child;
    }
  }
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) yield* sift(i, a.length);
  for (let end = a.length - 1; end > 0; end--) {
    yield* swap(a, 0, end); yield fixed([end]); yield* sift(0, end);
  }
  yield fixed(Array.from(a.keys()));
}
export function* shell(a) {
  let gap = 1;
  while (gap < a.length / 3) gap = 3 * gap + 1;
  // Insertion Sort mit großen Abständen; der letzte Abstand ist immer eins.
  for (; gap >= 1; gap = Math.floor(gap / 3)) {
    for (let i = gap; i < a.length; i++) {
      const key = a[i]; let j = i;
      yield { type: 'pivot', indices: [i], values: [key] };
      while (j >= gap) {
        yield compare(j - gap, null, [a[j - gap], key]);
        if (a[j - gap] <= key) break;
        yield write(a, j, a[j - gap]); j -= gap;
      }
      if (j !== i) yield write(a, j, key);
    }
  }
  yield fixed(Array.from(a.keys()));
}
export function* counting(a, maxValue = 1000) {
  if (!a.length) return;
  // Die Oberfläche kennt den Wertebereich 0…n schon aus der Datenerzeugung.
  // Der Standardbereich 0…1000 erlaubt die direkte Nutzung im Unterrichtstest.
  const max = maxValue, counts = new Array(max + 1), output = new Array(a.length);
  // k mögliche Höhen: erst Häufigkeiten, dann die Endposition jeder Höhe berechnen.
  for (let v = 0; v <= max; v++) { counts[v] = 0; yield { type: 'auxiliary', indices: [], writes: 1 }; }
  for (let i = 0; i < a.length; i++) { counts[a[i]]++; yield { type: 'auxiliary', indices: [i], writes: 1 }; }
  for (let v = 1; v <= max; v++) { counts[v] += counts[v - 1]; yield { type: 'auxiliary', indices: [], writes: 1 }; }
  // Von rechts einfügen erhält die Reihenfolge gleich großer Werte (stabil).
  for (let i = a.length - 1; i >= 0; i--) {
    output[--counts[a[i]]] = a[i]; yield { type: 'auxiliary', indices: [i], writes: 2 };
  }
  for (let i = 0; i < a.length; i++) { yield write(a, i, output[i]); yield fixed([i]); }
}
export const algorithms = { bubble, selection, insertion, merge, quick, heap, shell, counting };
// Ein Worker erhält dieselben Funktionen, auch beim Start über file://.
export const algorithmWorkerSource = [compare, swap, fixed, write, ...Object.values(algorithms)]
  .map(fn => fn.toString()).join('\n') + '\nconst algorithms = { bubble, selection, insertion, merge, quick, heap, shell, counting };';
export function countEvent(totals, event) {
  totals.comparisons += event.comparisons || 0;
  totals.writes += event.writes || 0;
}
