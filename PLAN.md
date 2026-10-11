# Plan – Ordnung muss sein

## Ausgangspunkt und Annahmen
Das einzige über das GitHub-Plugin sichtbare Repository ist `sl3ndrr/ordnung-muss-sei` (leer). Es ist das Ziel. Keine vorhandenen Konventionen. Statische Dateien im Repository-Wurzelverzeichnis; keine Abhängigkeiten und kein Laufzeit-Build. Keine automatische öffentliche Veröffentlichung: GitHub Pages lässt sich später für main / root aktivieren.

## Aufbau
- `index.html`, `styles.css`: semantische Oberfläche und responsives Design.
- `js/algorithms.js`: acht Generatoren mit gemeinsamen, zählbaren Ereignissen.
- `js/data.js`, `js/renderer.js`, `js/audio.js`: Eingaben, Canvas, Web Audio.
- `js/benchmark.js`: isolierter Worker, fünf Messungen plus Aufwärmen, Median.
- `js/info.js`, `js/app.js`: Unterrichtstexte und Steuerung.
- `tests/algorithms.mjs`: Korrektheit und Operationszählung ohne Build.
- `tools/embed.mjs`: aktualisiert die bereits eingecheckte Doppelklick-Variante im HTML. Dies ist nur bei Quellcodeänderungen nötig, kein Start-/Deployment-Build.

## Design
Warmes Papier (#f5f2e9), fast schwarze Druckfarbe (#262820), Terrakotta (#a6452d), Waldgrün (#386347), Ocker (#8a650d). Die drei Akzentfarben benennen Aktionen; Neutrale bilden die Grundansicht. Charakter durch große Georgia-Schrift für Titel und einen sachlichen Systemstack für Bedienelemente. Großzügiges Raster und feine Linien statt schwebender Karten. Balken als Hauptdarsteller. Zustände zusätzlich mit Symbolen, Umrissen und erklärender Textzeile.

## Reihenfolge und Commits
1. Plan dokumentieren.
2. Funktionierendes Gerüst: Bubble Sort, Canvas, Steuerung, leiser Synthesizer.
3. Übrige Algorithmen, faire parallele Läufe, Worker-Benchmark, Rangliste und Informationen.
4. Animation/Responsivität/Barrierefreiheit nachprüfen, Tests und README abschließen.

## Prüfungen
Alle Algorithmen gegen eine Referenzsortierung: leere/kleine Eingaben, Duplikate, jede Anordnung bis 1000, deterministische Zufallsfälle. Browserprüfung falls die bereitgestellte Laufzeit einen Browser enthält: Desktop, Handy, file://, Pause/Schritt, Vergleich, Benchmark, reduzierte Bewegung, Audiofreigabe, 1000 Balken. Messwerte und Grenzen im README festhalten.
