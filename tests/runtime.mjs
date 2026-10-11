import assert from 'node:assert/strict';
import { WorkerAdapter } from './worker-adapter.mjs';
import { Experiment } from '../js/player.js';
import { algorithms } from '../js/algorithms.js';
import { makeData } from '../js/data.js';
import { runBenchmark } from '../js/benchmark.js';
// Browser-Worker-Schnittstelle als Adapter auf Node: der echte Worker-Code bleibt unverändert.
globalThis.Worker = WorkerAdapter;
const input = makeData(1000, 'random', 17), before = input.slice();
const ids = ['bubble', 'insertion', 'merge', 'quick'];
const experiment = new Experiment(input, ids);
assert.notEqual(experiment.runs[0].data, experiment.runs[1].data);
experiment.runs.forEach(r => assert.deepEqual(r.data, input));
experiment.step();
assert.equal(experiment.runs[0].comparisons, 1);
assert.equal(experiment.runs[1].event.type, 'pivot');
while (!experiment.finished) experiment.step();
experiment.runs.forEach(r => assert.deepEqual(r.data, [...input].sort((a, b) => a - b)));
assert.deepEqual(input, before);
assert.equal(experiment.step().length, 0);
const progress = [];
const result = await runBenchmark(input, ids, n => progress.push(n)).promise;
assert.deepEqual(progress, [1, 2, 3, 4, 5, 6]);
for (const measured of result) {
  const visual = experiment.runs.find(r => r.id === measured.id);
  assert.equal(measured.comparisons, visual.comparisons);
  assert.equal(measured.writes, visual.writes);
  assert.equal(measured.times.length, 5); assert.equal(measured.median, measured.times[2]);
  assert.ok(measured.median >= 0);
}
const cancelled = runBenchmark(input, Object.keys(algorithms), () => {});
cancelled.cancel(); await assert.rejects(cancelled.promise, /abgebrochen/);
// Renderer-Schnittstellen prüfen, einschließlich reduced motion und 1000 Balken.
const media = { matches: false }; globalThis.matchMedia = () => media;
globalThis.devicePixelRatio = 2;
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
let rectangles = 0;
const context = {
  setTransform() {}, setLineDash() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
  fillRect(x, y, w, h) { assert.ok([x, y, w, h].every(Number.isFinite)); assert.ok(w > 0 && h > 0); rectangles++; }
};
const canvas = { getContext: () => context, getBoundingClientRect: () => ({ width: 600, height: 280 }) };
const { BarRenderer } = await import('../js/renderer.js');
const renderer = new BarRenderer(canvas, input);
for (const type of ['compare', 'swap', 'write', 'pivot', 'auxiliary', 'fixed']) {
  renderer.update({ type, indices: [0, 999] }); renderer.draw(input, 1000, 16);
}
media.matches = true; renderer.draw(input, 1000, 32); renderer.finish(32); renderer.draw(input, 1000, 48);
assert.ok(rectangles >= 8000); assert.equal(canvas.width, 1200); renderer.destroy();
// Audiofreigabe, Stummschalten und begrenzte Polyphonie ohne Lautsprecher testen.
let oscillators = 0, finishedCallbacks = [], gainValues = [];
class FakeAudioContext {
  constructor() { this.currentTime = 1; this.destination = {}; }
  resume() { return Promise.resolve(); }
  createDynamicsCompressor() { return { connect() {} }; }
  createGain() { return { gain: { value: 0, setTargetAtTime(v) { gainValues.push(v); }, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  createOscillator() { oscillators++; const o = { frequency: {}, connect() {}, disconnect() {}, start() {}, stop() { finishedCallbacks.push(() => o.onended()); } }; return o; }
}
globalThis.window = { AudioContext: FakeAudioContext };
const { SortAudio } = await import('../js/audio.js');
const audio = new SortAudio(); assert.equal(audio.enabled, false);
audio.tone(50, 100); assert.equal(oscillators, 0);
await audio.toggle(); for (let i = 0; i < 20; i++) audio.tone(i, 100);
assert.equal(oscillators, 6); assert.equal(audio.voices, 6);
finishedCallbacks.forEach(fn => fn()); assert.equal(audio.voices, 0);
audio.setVolume(0.12); await audio.toggle(); assert.equal(audio.enabled, false); assert.equal(gainValues.at(-1), 0);
console.log('OK: vier parallele 1000er-Läufe, identische Benchmark-Zähler, Median, Abbruch, Renderzustände und Audiofreigabe.');
console.table(result.map(({id, median, comparisons, writes}) => ({Algorithmus: id, 'Median (ms)': median.toFixed(2), Vergleiche: comparisons, Schreiben: writes})));
