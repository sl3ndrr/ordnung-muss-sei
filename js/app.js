import { algorithms, countEvent } from './algorithms.js';
import { makeData, arrangements } from './data.js';
import { BarRenderer } from './renderer.js';
import { SortAudio } from './audio.js';
import { info } from './info.js';
const $ = id => document.getElementById(id);
const audio = new SortAudio();
let input = [], runs = [], running = false, race = false, lastFrame = 0, budget = 0, lastUI = 0;
let selected = ['bubble'];
const format = number => number.toLocaleString('de-DE');
function rate() { return Math.round(Math.pow(200000, Number($('speed').value) / 100)); }
function showInfo(id) {
  const item = info[id];
  $('info-detail').innerHTML = `<h3>${item.name}</h3><p>${item.idea}</p><dl class="properties"><div><dt>Bester Fall</dt><dd>${item.best}</dd></div><div><dt>Durchschnitt</dt><dd>${item.average}</dd></div><div><dt>Schlechtester Fall</dt><dd>${item.worst}</dd></div><div><dt>Zusatzspeicher</dt><dd>${item.memory}</dd></div><div><dt>Stabil (gleiche bleiben in Reihenfolge)</dt><dd>${item.stable ? 'Ja' : 'Nein'}</dd></div><div><dt>In-place (im vorhandenen Feld)</dt><dd>${item.inplace ? 'Ja' : 'Nein'}</dd></div></dl><div class="info-bottom"><div><h4>Pseudocode · die Idee als Schritte</h4><pre></pre></div><div><h4>Wann lohnt sich das?</h4><p>${item.use}</p></div></div>`;
  $('info-detail').querySelector('pre').textContent = item.code;
  $('info-nav').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
}
function buildRuns(newData = false) {
  running = false; budget = 0;
  if (newData) input = makeData(Number($('size').value), $('arrangement').value);
  runs.forEach(r => r.renderer.destroy()); $('stages').replaceChildren();
  const ids = race ? selected : [$('algorithm').value];
  runs = ids.map(id => {
    const section = document.createElement('section'); section.className = 'stage';
    section.innerHTML = `<div class="stage-head"><h3>${info[id].name}</h3><span class="tag">${info[id].short}</span></div><canvas role="img" aria-label="${info[id].name}: ${input.length} Balken, noch unsortiert"></canvas><div class="stage-stats"><span>Vergleiche<strong class="compare-count">0</strong></span><span>Schreiboperationen<strong class="write-count">0</strong></span><span>Gesamt<strong class="total-count">0</strong></span></div><div class="action-note">Bereit für den ersten Vergleich.</div>`;
    $('stages').append(section);
    const data = input.slice(); const canvas = section.querySelector('canvas');
    return { id, data, generator: algorithms[id](data), renderer: new BarRenderer(canvas, data), section, comparisons: 0, writes: 0, done: false, event: null };
  });
  $('ranking').replaceChildren(); $('explanation').textContent = ''; $('results-intro').textContent = 'Die Rangliste erscheint nach dem Sortieren. Du kannst auch direkt die Laufzeit messen.';
  $('status').textContent = `Bereit: ${input.length} Balken · ${arrangements[$('arrangement').value]}.`;
  $('stages').classList.toggle('race', race); updateUI();
}
function advance() {
  for (const run of runs) {
    if (run.done) continue;
    const next = run.generator.next();
    if (next.done) { run.done = true; run.renderer.finish(performance.now()); continue; }
    const event = next.value; run.event = event; countEvent(run, event); run.renderer.update(event);
    audio.play(event, run.data, Math.max(...input));
  }
  if (runs.every(r => r.done)) {
    running = false; audio.finish(); $('status').textContent = 'Fertig sortiert. Vergleiche jetzt den Aufwand in der Rangliste.'; showRanking(); updateUI();
  }
}
function actionText(run) {
  if (run.done) return '✓ Alle Werte sind endgültig einsortiert.';
  const event = run.event; if (!event) return 'Bereit für den ersten Vergleich.';
  const positions = event.indices.map(i => i + 1).slice(0, 2).join(' und ');
  return `${({ compare: '━ Vergleich', swap: '═ Tausch', write: '═ Schreiben', pivot: '▼ Referenz', fixed: '· Endgültig einsortiert', auxiliary: '═ Hilfsfeld schreiben' })[event.type]}${positions ? ` · Position ${positions}` : ''}`;
}
function updateUI() {
  $('play').textContent = running ? 'Ⅱ Pause' : runs.every(r => r.done) ? '↻ Noch einmal' : '▶ Start';
  $('step').disabled = running || runs.every(r => r.done);
  for (const run of runs) {
    run.section.querySelector('.compare-count').textContent = format(run.comparisons);
    run.section.querySelector('.write-count').textContent = format(run.writes);
    run.section.querySelector('.total-count').textContent = format(run.comparisons + run.writes);
    run.section.querySelector('.action-note').textContent = actionText(run);
    run.renderer.canvas.setAttribute('aria-label', `${info[run.id].name}: ${actionText(run)} ${format(run.comparisons)} Vergleiche, ${format(run.writes)} Schreiboperationen.`);
  }
}
function showRanking() {
  const sorted = [...runs].sort((a, b) => a.comparisons + a.writes - b.comparisons - b.writes);
  const max = Math.max(1, ...sorted.map(r => r.comparisons + r.writes));
  $('results-intro').textContent = 'Weniger Operationen = weniger Arbeit in diesem Modell. Ocker: Vergleiche. Terrakotta: Schreiboperationen.';
  $('ranking').innerHTML = sorted.map((r, i) => `<div class="rank-row"><span class="rank">${i + 1}</span><span class="rank-name">${info[r.id].name}</span><div class="rank-track" aria-hidden="true"><span class="comparisons" style="width:${r.comparisons / max * 100}%"></span><span class="writes" style="width:${r.writes / max * 100}%"></span></div><span class="rank-total">${format(r.comparisons + r.writes)}<small>Operationen</small></span><span class="rank-time">—<small>noch nicht gemessen</small></span></div>`).join('');
}
function frame(now) {
  const dt = Math.min(50, now - (lastFrame || now)); lastFrame = now;
  if (running) {
    budget = Math.min(12000, budget + rate() * dt / 1000); const end = performance.now() + 5;
    while (budget >= 1 && running && performance.now() < end) { advance(); budget--; }
  }
  const max = Math.max(...input);
  runs.forEach(r => r.renderer.draw(r.data, max, now, rate() > 1500));
  if (now - lastUI > 100) { updateUI(); lastUI = now; }
  requestAnimationFrame(frame);
}
Object.entries(info).forEach(([id, item]) => {
  $('algorithm').add(new Option(item.name, id));
  const button = document.createElement('button'); button.textContent = item.name; button.dataset.id = id; button.addEventListener('click', () => showInfo(id)); $('info-nav').append(button);
});
$('play').addEventListener('click', () => { if (runs.every(r => r.done)) buildRuns(); running = !running; budget = 0; $('status').textContent = running ? 'Sortierung läuft.' : 'Pausiert. Du kannst einzelne Schritte ansehen.'; updateUI(); });
$('step').addEventListener('click', () => { advance(); updateUI(); });
$('reset').addEventListener('click', () => buildRuns());
$('shuffle').addEventListener('click', () => buildRuns(true));
$('size').addEventListener('input', () => { $('size-label').value = $('size').value; });
$('size').addEventListener('change', () => buildRuns(true));
$('arrangement').addEventListener('change', () => buildRuns(true));
$('algorithm').addEventListener('change', () => { buildRuns(); showInfo($('algorithm').value); });
$('speed').addEventListener('input', () => { $('speed-label').value = `${format(rate())} Schritte/s`; budget = 0; });
$('sound').addEventListener('click', async () => { try { const enabled = await audio.toggle(); $('sound').textContent = enabled ? 'Ton an' : 'Ton aus'; $('sound').setAttribute('aria-pressed', enabled); } catch (e) { $('status').textContent = e.message; } });
$('volume').addEventListener('input', () => audio.setVolume(Number($('volume').value) / 100));
$('single-mode').addEventListener('click', () => { race = false; buildRuns(); });
$('race-mode').addEventListener('click', () => { $('status').textContent = 'Der Vergleichsmodus folgt im nächsten Umsetzungsschritt.'; });
$('benchmark').disabled = true; $('challenge-button').disabled = true;
showInfo('bubble'); buildRuns(true); $('speed-label').value = `${format(rate())} Schritte/s`; requestAnimationFrame(frame);
