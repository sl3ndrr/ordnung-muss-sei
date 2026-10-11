import { Experiment } from './player.js';
import { makeData, arrangements } from './data.js';
import { BarRenderer, motionPreference } from './renderer.js';
import { SortAudio } from './audio.js';
import { info, explainWinner } from './info.js';
import { runBenchmark } from './benchmark.js';
const $ = id => document.getElementById(id);
const audio = new SortAudio();
let experiment, input = [], runs = [], running = false, race = false, lastFrame = 0, budget = 0, lastUI = 0;
let selected = ['insertion', 'merge', 'quick', 'heap'];
let measurement = null, benchmarkResults = null, generation = 0, inputMax = 1;
const format = number => number.toLocaleString('de-DE');
function rate() { return Math.round(Math.pow(200000, Number($('speed').value) / 100)); }
function showInfo(id) {
  const item = info[id];
  $('info-detail').innerHTML = `<h3>${item.name}</h3><p>${item.idea}</p><p class="notation-note">n ist die Zahl der Werte. Die O-Notation beschreibt, wie der Aufwand mit der Listengröße wächst; z. B. wächst O(n²) quadratisch. Die genauen Begriffe erklärt das Glossar unten.</p><dl class="properties"><div><dt>Bester Fall</dt><dd>${item.best}</dd></div><div><dt>Durchschnitt</dt><dd>${item.average}</dd></div><div><dt>Schlechtester Fall</dt><dd>${item.worst}</dd></div><div><dt>Zusatzspeicher</dt><dd>${item.memory}</dd></div><div><dt>Stabil (gleiche bleiben in Reihenfolge)</dt><dd>${item.stable ? 'Ja' : 'Nein'}</dd></div><div><dt>In-place (im vorhandenen Feld)</dt><dd>${item.inplace ? 'Ja' : 'Nein'}</dd></div></dl><div class="info-bottom"><div><h4>Pseudocode · vereinfachte Schrittbeschreibung</h4><pre></pre></div><div><h4>Wann lohnt sich das?</h4><p>${item.use}</p></div></div>`;
  $('info-detail').querySelector('pre').textContent = item.code;
  $('info-nav').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.id === id));
}
function buildRuns(newData = false) {
  running = false; budget = 0; generation++; benchmarkResults = null;
  if (measurement) { measurement.cancel(); measurement = null; }
  $('benchmark').textContent = 'Laufzeit messen ↗'; $('benchmark-status').textContent = '';
  if (newData) input = makeData(Number($('size').value), $('arrangement').value);
  inputMax = Math.max(...input);
  runs.forEach(r => r.renderer.destroy()); $('stages').replaceChildren();
  const ids = race ? selected : [$('algorithm').value];
  experiment = new Experiment(input, ids);
  runs = experiment.runs.map(run => {
    const { id, data } = run;
    const section = document.createElement('section'); section.className = 'stage';
    section.innerHTML = `<div class="stage-head"><h3>${info[id].name}</h3><span class="tag">${info[id].short}</span></div><canvas role="img" aria-label="${info[id].name}: ${input.length} Balken, noch unsortiert"></canvas><div class="stage-stats"><span>Vergleiche<strong class="compare-count">0</strong></span><span>Schreiboperationen<strong class="write-count">0</strong></span><span>Gesamt<strong class="total-count">0</strong></span></div><div class="action-note">Bereit für den ersten Vergleich.</div>`;
    $('stages').append(section);
    const canvas = section.querySelector('canvas');
    run.renderer = new BarRenderer(canvas, data); run.section = section;
    return run;
  });
  $('ranking').replaceChildren(); $('explanation').textContent = ''; $('results-intro').textContent = 'Die Rangliste erscheint nach dem Sortieren. Du kannst auch direkt die Laufzeit messen.';
  $('status').textContent = `Bereit: ${input.length} Balken · ${arrangements[$('arrangement').value]}.`;
  $('stages').classList.toggle('race', race);
  document.querySelector('.setup').classList.toggle('race-setup', race);
  $('single-selection').hidden = race; $('race-selection').hidden = !race;
  $('single-mode').setAttribute('aria-pressed', !race); $('race-mode').setAttribute('aria-pressed', race);
  updateCheckboxes(); updateUI();
}
function advance() {
  for (const run of experiment.step()) {
    if (run.done) { run.renderer.finish(performance.now()); continue; }
    run.renderer.update(run.event);
    audio.play(run.event, run.data, inputMax);
  }
  if (runs.every(r => r.done)) {
    running = false; audio.finish(); $('status').textContent = 'Fertig sortiert. Vergleiche jetzt den Aufwand in der Rangliste.'; showRanking(); updateUI();
  }
}
function actionText(run) {
  if (run.done) return '✓ Alle Werte sind endgültig einsortiert.';
  const event = run.event; if (!event) return 'Bereit für den ersten Vergleich.';
  if (event.type === 'compare') {
    const values = event.values || event.indices.map(i => run.data[i]);
    return `━ Vergleich · ${values[0]} mit ${values[1]} (Position ${event.indices[0] + 1}${event.values ? ', Referenzwert' : ` und ${event.indices[1] + 1}`})`;
  }
  if (event.type === 'pivot') return `▼ Referenzwert: ${event.values?.[0] ?? run.data[event.indices[0]]}`;
  const positions = event.indices.map(i => i + 1).slice(0, 2).join(' und ');
  return `${({ compare: '━ Vergleich', swap: '═ Tausch', write: '═ Schreiben', pivot: '▼ Referenz', fixed: '· Endgültig einsortiert', auxiliary: '═ Hilfsfeld schreiben' })[event.type]}${positions ? ` · Position ${positions}` : ''}`;
}
function updateUI() {
  $('play').textContent = running ? 'Ⅱ Pause' : runs.every(r => r.done) ? '↻ Noch einmal' : '▶ Start';
  $('step').disabled = running || !!measurement || runs.every(r => r.done);
  $('play').disabled = !!measurement;
  for (const run of runs) {
    run.section.querySelector('.compare-count').textContent = format(run.comparisons);
    run.section.querySelector('.write-count').textContent = format(run.writes);
    run.section.querySelector('.total-count').textContent = format(run.comparisons + run.writes);
    run.section.querySelector('.action-note').textContent = actionText(run);
    run.renderer.canvas.setAttribute('aria-label', `${info[run.id].name}: ${actionText(run)} ${format(run.comparisons)} Vergleiche, ${format(run.writes)} Schreiboperationen.`);
  }
}
function showRanking(records = runs) {
  const sorted = [...records].sort((a, b) => a.comparisons + a.writes - b.comparisons - b.writes);
  const max = Math.max(1, ...sorted.map(r => r.comparisons + r.writes));
  $('results-intro').textContent = `${input.length} Balken · ${arrangements[$('arrangement').value]}. Weniger Operationen = weniger Arbeit in diesem Modell. Ocker: Vergleiche (V). Terrakotta: Schreiben (S).`;
  let rank = 0, previous = -1;
  $('ranking').innerHTML = sorted.map((r, i) => {
    const total = r.comparisons + r.writes;
    if (total !== previous) rank = i + 1;
    previous = total;
    const measured = benchmarkResults?.find(result => result.id === r.id);
    return `<div class="rank-row"><span class="rank">${rank}</span><span class="rank-name">${info[r.id].name}</span><div class="rank-track" aria-hidden="true"><span class="comparisons" style="width:${r.comparisons / max * 100}%"></span><span class="writes" style="width:${r.writes / max * 100}%"></span></div><span class="rank-total">${format(total)}<small>${format(r.comparisons)} V / ${format(r.writes)} S</small></span><span class="rank-time">${measured ? `${measured.median.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ms` : '—'}<small>${measured ? 'Median · 5 Läufe' : 'noch nicht gemessen'}</small></span></div>`;
  }).join('');
  const tied = sorted.filter(r => r.comparisons + r.writes === sorted[0].comparisons + sorted[0].writes);
  $('explanation').textContent = tied.length > 1 ? `Gleichstand: ${tied.map(r => info[r.id].name).join(' und ')} brauchen gleich viele Operationen. Die Art der Arbeit und die gemessene Laufzeit können sich trotzdem unterscheiden.` : explainWinner(sorted[0].id, $('arrangement').value, sorted.length);
}
function updateCheckboxes() {
  $('contestants').querySelectorAll('input').forEach(box => {
    box.checked = selected.includes(box.value);
    box.disabled = box.checked ? selected.length <= 2 : selected.length >= 4;
  });
}
async function measure() {
  if (measurement) { measurement.cancel(); measurement = null; return; }
  running = false; budget = 0; updateUI();
  const version = generation;
  $('benchmark').textContent = 'Messung abbrechen';
  $('benchmark-status').textContent = 'Aufwärmen und fünf Messungen ohne Animation …';
  $('status').textContent = 'Animation pausiert für die Laufzeitmessung.';
  try {
    measurement = runBenchmark(input, runs.map(r => r.id), progress => {
      $('benchmark-status').textContent = progress === 1 ? 'Aufwärmlauf abgeschlossen. Fünf Messungen folgen …' : `Messung ${progress - 1} von 5 abgeschlossen …`;
    });
    updateUI();
    const result = await measurement.promise;
    if (version !== generation) return;
    benchmarkResults = result;
    showRanking(benchmarkResults);
    const fastest = [...benchmarkResults].sort((a, b) => a.median - b.median)[0];
    $('benchmark-status').textContent = `Gemessen: ${info[fastest.id].name} hat hier den kleinsten Laufzeit-Median. Median = mittlerer von fünf Messwerten. Kleine Unterschiede können Messrauschen sein. V = Vergleiche, S = Schreiboperationen.`;
  } catch (error) { if (version === generation) $('benchmark-status').textContent = error.message; }
  finally { if (version === generation) { measurement = null; $('benchmark').textContent = 'Laufzeit messen ↗'; updateUI(); } }
}
function frame(now) {
  const dt = Math.min(50, now - (lastFrame || now)); lastFrame = now;
  if (running) {
    budget = Math.min(12000, budget + rate() * dt / 1000); const end = performance.now() + 5;
    while (budget >= 1 && running && performance.now() < end) { advance(); budget--; }
  }
  runs.forEach(r => r.renderer.draw(r.data, inputMax, now, running && rate() > 1500));
  if (now - lastUI > 100) { updateUI(); lastUI = now; }
  requestAnimationFrame(frame);
}
Object.entries(info).forEach(([id, item]) => {
  $('algorithm').add(new Option(item.name, id));
  const button = document.createElement('button'); button.textContent = item.name; button.dataset.id = id; button.addEventListener('click', () => showInfo(id)); $('info-nav').append(button);
});
$('play').addEventListener('click', () => { if (measurement) return; if (runs.every(r => r.done)) buildRuns(); running = !running; budget = 0; $('status').textContent = running ? 'Sortierung läuft.' : 'Pausiert. Du kannst einzelne Schritte ansehen.'; updateUI(); });
$('step').addEventListener('click', () => { advance(); updateUI(); if (!experiment.finished) $('status').textContent = runs.map(r => `${info[r.id].name}: ${actionText(r)}`).join(' · '); });
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
$('race-mode').addEventListener('click', () => { race = true; buildRuns(); });
Object.entries(info).forEach(([id, item]) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = id;
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) selected.push(id); else selected = selected.filter(value => value !== id);
    buildRuns();
  });
  label.append(checkbox, item.name); $('contestants').append(label);
});
$('benchmark').addEventListener('click', measure);
$('challenge-button').addEventListener('click', () => {
  selected = ['insertion', 'selection']; race = true; $('arrangement').value = 'nearly';
  buildRuns(true); showInfo('insertion'); $('labor').scrollIntoView({ behavior: motionPreference.matches ? 'auto' : 'smooth' });
});
// Lehrkräfte können die ausgewählte Steuerung mit Tab erreichen; kein globaler Space-Handler.
document.addEventListener('visibilitychange', () => { if (document.hidden && running) { running = false; budget = 0; $('status').textContent = 'Pausiert, weil das Fenster im Hintergrund ist.'; updateUI(); } });
showInfo('bubble'); buildRuns(true); $('speed-label').value = `${format(rate())} Schritte/s`; requestAnimationFrame(frame);
