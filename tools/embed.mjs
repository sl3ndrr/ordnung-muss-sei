// Nur für Änderungen am Quellcode: erzeugt den bereits eingecheckten file://-Start.
import { readFile, writeFile } from 'node:fs/promises';
const files = ['algorithms', 'data', 'renderer', 'audio', 'info', 'app'];
let body = '';
for (const name of files) {
  let source = await readFile(`js/${name}.js`, 'utf8');
  source = source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  body += `\n// ----- js/${name}.js -----\n${source}`;
}
const html = await readFile('index.html', 'utf8');
const embed = `<script type="module">\nif (location.protocol !== 'file:') {\n  import('./js/app.js');\n} else {\n${body}\n}\n</script>`;
await writeFile('index.html', html.replace(/<!-- EMBED_START -->[\s\S]*?<!-- EMBED_END -->/, `<!-- EMBED_START -->\n${embed}\n<!-- EMBED_END -->`));
console.log('Doppelklick-Variante aktualisiert.');
