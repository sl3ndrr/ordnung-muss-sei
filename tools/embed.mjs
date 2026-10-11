// Nur für Änderungen am Quellcode: erzeugt den bereits eingecheckten file://-Start.
import { readFile, writeFile } from 'node:fs/promises';
const files = ['algorithms', 'data', 'player', 'renderer', 'audio', 'info', 'benchmark', 'app'];
let body = '';
for (const name of files) {
  let source = await readFile(`js/${name}.js`, 'utf8');
  source = source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  body += `\n// ----- js/${name}.js -----\n${source}`;
}
const html = await readFile('index.html', 'utf8');
const embed = `<script type="module">\nif (location.protocol !== 'file:') {\n  import('./js/app.js');\n} else {\n${body}\n}\n</script>`;
const updated = html.replace(/<!-- EMBED_START -->[\s\S]*?<!-- EMBED_END -->/, `<!-- EMBED_START -->\n${embed}\n<!-- EMBED_END -->`);
if (process.argv.includes('--check')) {
  if (updated !== html) { console.error('Einbettung veraltet: node tools/embed.mjs ausführen.'); process.exit(1); }
  console.log('OK: Einbettung entspricht den Modulen.');
} else {
  await writeFile('index.html', updated);
  console.log('Doppelklick-Variante aktualisiert.');
}
