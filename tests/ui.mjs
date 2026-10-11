// Kein Browserersatz: prüft die echte eingebettete Steuerungslogik mit einem kleinen DOM-Testdouble.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { WorkerAdapter } from './worker-adapter.mjs';
class Element {
  constructor(tag = 'div', attrs = {}) {
    this.tag = tag; this.attrs = attrs; this.value = attrs.value || ''; this.children = []; this.handlers = {};
    this.dataset = {}; this.disabled = false; this.hidden = false; this.checked = false; this._text = '';
    this.classList = { toggle() {} };
  }
  set innerHTML(html) { this.html = html; this.children = parse(html); }
  get innerHTML() { return this.html || ''; }
  set textContent(value) { this._text = String(value); }
  get textContent() { return this._text || this.children.map(c => c.textContent).join(''); }
  append(...children) { this.children.push(...children.filter(c => typeof c !== 'string')); }
  replaceChildren(...children) { this.children = children; this.html = ''; }
  add(option) { this.children.push(option); if (!this.value) this.value = option.value; }
  addEventListener(event, handler) { (this.handlers[event] ||= []).push(handler); }
  async fire(event) { if (!this.disabled) for (const handler of this.handlers[event] || []) await handler({ target: this }); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  querySelectorAll(selector) {
    const match = e => selector.startsWith('.') ? (e.attrs.class || '').split(' ').includes(selector.slice(1)) : e.tag === selector;
    return this.children.flatMap(e => [ ...(match(e) ? [e] : []), ...e.querySelectorAll(selector) ]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getContext() { return { setTransform() {}, setLineDash() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {}, fill() {} }; }
  getBoundingClientRect() { return { width: 800, height: 285 }; }
  scrollIntoView() {}
}
function parse(html) {
  return [...html.matchAll(/<([a-z][a-z0-9-]*)([^>]*)>/g)].map(([, tag, raw]) => {
    const attrs = Object.fromEntries([...raw.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    return new Element(tag, attrs);
  });
}
const html = await readFile('index.html', 'utf8');
const document = new Element(); document.children = parse(html.split('<!-- EMBED_START -->')[0]);
document.createElement = tag => new Element(tag);
document.getElementById = id => document.children.find(e => e.attrs.id === id);
const $ = document.getElementById;
$('arrangement').value = 'random';
const frames = [];
const context = vm.createContext({
  document, console, performance, setTimeout, clearTimeout, Blob, URL, Worker: WorkerAdapter,
  location: { protocol: 'file:' }, window: {}, devicePixelRatio: 1,
  matchMedia: () => ({ matches: false }), ResizeObserver: class { observe() {} disconnect() {} },
  Option: function(text, value) { const e = new Element('option'); e.textContent = text; e.value = value; return e; },
  requestAnimationFrame: callback => frames.push(callback)
});
const embedded = html.match(/<!-- EMBED_START -->\s*<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(embedded, { filename: 'index.html embedded module' }).runInContext(context);
assert.equal($('algorithm').children.length, 8);
assert.equal($('stages').children.length, 1);
assert.equal($('sound').getAttribute('aria-pressed'), 'false');
$('size').value = '20'; await $('size').fire('input'); await $('size').fire('change');
$('arrangement').value = 'reversed'; await $('arrangement').fire('change');
await $('step').fire('click');
let stage = $('stages').children[0];
assert.equal(stage.querySelector('.compare-count').textContent, '1');
assert.match(stage.querySelector('.action-note').textContent, /20 mit 19/);
await $('step').fire('click'); assert.equal(stage.querySelector('.write-count').textContent, '2');
await $('reset').fire('click'); stage = $('stages').children[0];
assert.equal(stage.querySelector('.compare-count').textContent, '0');
await $('race-mode').fire('click'); assert.equal($('stages').children.length, 4);
assert.equal($('single-selection').hidden, true);
let boxes = $('contestants').querySelectorAll('input');
assert.equal(boxes.filter(b => b.checked).length, 4);
assert.equal(boxes.find(b => b.value === 'bubble').disabled, true);
await $('challenge-button').fire('click');
assert.equal($('stages').children.length, 2); assert.equal($('arrangement').value, 'nearly');
boxes = $('contestants').querySelectorAll('input');
assert.equal(boxes.filter(b => b.checked && b.disabled).length, 2);
$('speed').value = '100'; await $('speed').fire('input');
await $('play').fire('click'); assert.equal($('step').disabled, true);
await $('play').fire('click'); assert.equal($('step').disabled, false);
await $('play').fire('click');
for (let i = 0; i < 100 && $('play').textContent !== '↻ Noch einmal'; i++) {
  const callback = frames.shift(); assert.ok(callback); callback(performance.now() + i * 17 + 1);
}
assert.equal($('play').textContent, '↻ Noch einmal');
assert.match($('ranking').innerHTML, /Insertion Sort/); assert.match($('ranking').innerHTML, /Selection Sort/);
assert.match($('explanation').textContent, /Insertion Sort/);
await $('benchmark').fire('click');
assert.match($('benchmark-status').textContent, /Median/);
assert.match($('ranking').innerHTML, /Median · 5 Läufe/);
await $('single-mode').fire('click'); $('algorithm').value = 'counting'; await $('algorithm').fire('change');
assert.match($('info-detail').innerHTML, /Counting Sort/);
assert.equal($('race-selection').hidden, true);
for (const button of $('info-nav').children) await button.fire('click');
assert.match($('info-detail').innerHTML, /Counting Sort/);
console.log('OK: eingebetteter Start, Einzelschritt, Reset, Pause, Moduswechsel, Auswahlgrenzen, Lernaufgabe, Rangliste, Benchmark und acht Infoansichten.');
