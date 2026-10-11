import assert from 'node:assert/strict';
import { algorithms, countEvent } from '../js/algorithms.js';
import { makeData, randomGenerator } from '../js/data.js';
let cases = 0;
function test(input) {
  const expected = [...input].sort((a, b) => a - b);
  for (const [name, algorithm] of Object.entries(algorithms)) {
    const a = input.slice(), totals = { comparisons: 0, writes: 0 };
    let eventCount = 0;
    for (const event of algorithm(a)) {
      countEvent(totals, event); eventCount++;
      assert.ok(eventCount < 5000000, `${name}: kein Ende`);
      assert.ok((event.comparisons || 0) >= 0 && (event.writes || 0) >= 0);
      for (const index of event.indices) assert.ok(index >= 0 && index < a.length, `${name}: Index ${index}`);
      if (event.type === 'fixed') for (const index of event.indices) assert.equal(a[index], expected[index], `${name}: zu früh endgültig markiert`);
    }
    assert.deepEqual(a, expected, `${name}: falsches Ergebnis bei n=${input.length}`);
    assert.ok(Number.isInteger(totals.comparisons) && Number.isInteger(totals.writes));
    if (name === 'counting') assert.equal(totals.comparisons, 0);
    cases++;
  }
}
for (const input of [[], [1], [2, 1], [1, 2], [1, 1], [0, 0, 0], [3, 0, 2, 3, 1], Array(1000).fill(7)]) test(input);
for (const n of [20, 21, 80, 257, 500, 1000]) for (const arrangement of ['random', 'nearly', 'reversed', 'duplicates']) test(makeData(n, arrangement, 12345));
const random = randomGenerator(42);
for (let sample = 0; sample < 150; sample++) test(Array.from({ length: Math.floor(random() * 100) }, () => Math.floor(random() * 40)));
// Gleich große, identifizierbare Objekte prüfen die behauptete Stabilität.
for (const name of ['bubble', 'insertion', 'merge', 'counting']) {
  const values = [2, 1, 3, 1, 2, 3, 1];
  const a = values.map((value, id) => ({ value, id, valueOf() { return value; }, [Symbol.toPrimitive]() { return value; } }));
  for (const event of algorithms[name](a)) { /* Generator vollständig ausführen. */ }
  for (const value of [1, 2, 3]) assert.deepEqual(a.filter(x => x.value === value).map(x => x.id), values.flatMap((v, i) => v === value ? [i] : []), `${name}: nicht stabil`);
}
const count = (id, a, maxValue) => { const t = { comparisons: 0, writes: 0 }; for (const e of algorithms[id](a, maxValue)) countEvent(t, e); return t; };
assert.deepEqual(count('bubble', [2, 1]), { comparisons: 1, writes: 2 });
assert.deepEqual(count('insertion', [2, 1]), { comparisons: 1, writes: 2 });
assert.deepEqual(count('selection', [3, 2, 1]), { comparisons: 3, writes: 2 });
assert.deepEqual(count('merge', [2, 1]), { comparisons: 1, writes: 4 });
assert.deepEqual(count('counting', [2, 1], 2), { comparisons: 0, writes: 13 });
for (const n of [20, 100, 1000]) {
  assert.equal(count('insertion', Array.from({ length: n }, (_, i) => i)).comparisons, n - 1);
  assert.equal(count('selection', Array.from({ length: n }, (_, i) => i)).comparisons, n * (n - 1) / 2);
}
assert.deepEqual(makeData(100, 'random', 17), makeData(100, 'random', 17));
console.log(`OK: ${cases} Sortierfälle, vier Stabilitätstests, endgültige Markierungen und Operationszählungen.`);
