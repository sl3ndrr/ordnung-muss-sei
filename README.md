# Ordnung muss sein

Ein deutschsprachiges Sortierlabor für den Informatikunterricht (Klassen 9–12). Balken zeigen den Weg vom Durcheinander zur Ordnung; ein sanfter Synthesizer macht die verglichenen Höhen hörbar. Der Vergleich stellt die Frage: **Wie viel Arbeit braucht dieser Weg auf genau diesen Daten?**

## Starten

Das Repository herunterladen oder klonen und **`index.html` doppelklicken**. JavaScript muss aktiviert sein; ein aktueller Browser mit Canvas, ES-Modulen, ResizeObserver, Web Audio und Web Workers wird vorausgesetzt. Es gibt keine Installation, keine externen Schriften, keine CDN-Dateien und keinen Build beim Start.

Alternativ im Repository-Verzeichnis:

```sh
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Auf einem HTTP-Server werden die separaten ES-Module geladen. Beim Doppelklick läuft eine bereits eingebettete Kopie derselben Module: Browser blockieren häufig externe ES-Module unter `file://`. Die Kopie wird mit eingecheckt und auf Übereinstimmung geprüft. Auch der Benchmark lädt dort seinen Worker aus einem lokal erzeugten Blob.

### GitHub Pages

Im Repository unter **Settings → Pages → Deploy from a branch** den Branch **main** und **/(root)** wählen. Die vorhandenen Dateien funktionieren ohne Actions-Workflow oder Build unverändert. Pages wurde bei der Umsetzung nicht aktiviert; es wurde keine zusätzliche Hosting-Plattform eingerichtet.

## Funktionen

- 20–1000 Balken; zufällig, fast sortiert, umgekehrt oder mit vielen Duplikaten.
- Bubble, Selection, Insertion, Merge, Quick, Heap, Shell und Counting Sort.
- Start/Pause, Einzelaktionen, Zurücksetzen mit identischen Daten und neue Eingaben.
- Logarithmischer Temporegler von 1 bis 200.000 Aktionen pro Sekunde. Das effektive Maximum hängt vom Gerät ab; aufwendige Algorithmen blockieren die Oberfläche nicht absichtlich, um eine Sollgeschwindigkeit zu erzwingen.
- 2–4 gleichzeitig gewählte Verfahren erhalten Kopien derselben Eingabe und in jeder Runde je eine Aktion. Fertige Verfahren warten auf die übrigen.
- Vergleich, Tausch/Schreiben, Referenz und endgültige Positionen mit Farben, Formmarkierungen und Text. Eine gestrichelte Höhenlinie zeigt gemerkte Referenzwerte auch dann, wenn ihr ursprünglicher Balkenplatz inzwischen verändert wurde. Geordnete Teilfolgen bei Insertion/Merge werden erst dann endgültig markiert, wenn das stimmt.
- Höhen gehen in zwei Oktaven von 160–640 Hz über. Ton standardmäßig aus; explizite Freigabe per Schaltfläche, Lautstärke, sechs Stimmen maximal, kurze Hüllkurven, Kompressor und Begrenzung auf höchstens 25 Tonpaare pro Sekunde.
- Rangliste nach **Vergleichen + Schreiboperationen**, mit getrennten Diagrammanteilen und einer Erklärung zum Gewinner. Ein Tausch zählt zwei Schreiboperationen; Hilfsfelder werden mitgezählt.
- Abbrechbarer Worker-Benchmark ohne Zeichnen/Audio: ein Aufwärmlauf, fünf Messungen, Median. Gleiche Generatorimplementierung wie bei der Animation; Kopieren der Eingabe liegt außerhalb der Messung.
- Detailansichten mit Grundidee, O-Notation, Speicher, Stabilität, in-place, Pseudocode und Einordnung. Ein kleines Glossar und eine vorbereitete Unterrichtsaufgabe helfen beim Verstehen.
- Responsive Raster, semantische Beschriftungen, sichtbare Tastaturfokusse, Sprunglink, zurückhaltende Statusmeldungen und ruhige Darstellung bei `prefers-reduced-motion`.

Die Laufzeit-Rangfolge muss nicht der Operationsrangfolge entsprechen: Operationen werden im Modell gleich gewichtet, sind auf realer Hardware aber unterschiedlich teuer. Generatorereignisse haben ebenfalls Aufwand. Gerade kleine Zeitunterschiede sind kein Beweis für einen allgemeinen Sieger.

## Code lesen

| Datei | Aufgabe |
| --- | --- |
| `index.html` | Semantische Oberfläche; unten die gekennzeichnete file://-Einbettung |
| `styles.css` | Designsystem und Breakpoints bei 1000 / 620 px |
| `js/algorithms.js` | Lesbare Generatoren und gemeinsame Ereignisse |
| `js/data.js` | Vier Anordnungen und reproduzierbare Zufallszahlen für Tests |
| `js/player.js` | Kopien der Eingabe, faire Schritte, Operationszähler ohne Darstellung |
| `js/renderer.js` | Canvas, sanfte Höheninterpolation, Zustandsmarkierungen und Abschlusswelle |
| `js/audio.js` | Web-Audio-Synthese und Freigabe |
| `js/benchmark.js` | Worker, Messreihen, Median und Abbruch |
| `js/info.js` | Deutsche Erklärtexte, Kennwerte und Gewinnerbegründungen |
| `js/app.js` | Bedienelemente, Frame-Takt, Rangliste und Verbindung der Module |
| `tests/` | Sortier-, Worker-, Rendering-, Audio- und Steuerungsprüfungen |
| `tools/embed.mjs` | Aktualisieren und Prüfen der eingecheckten Einbettung |

Ein Generator verändert sein übergebenes Feld und liefert pro Aktion ein Ereignis. `compare` liefert es **vor** der Entscheidung; `swap` und `write` ändern das Feld **vor** dem Ereignis. `comparisons` und `writes` sind die unabhängig vom Tempo gezählten Kosten. `fixed` darf ausschließlich wirklich endgültige Positionen markieren. Das UI zeichnet höchstens einmal pro Frame und aktualisiert Textzähler höchstens zehnmal pro Sekunde; nur die Algorithmen arbeiten schneller. Eine Rechenphase hat ein Budget von etwa fünf Millisekunden pro Frame. Canvas-Geometrie wird an physische Pixel angepasst; abgeschlossene, ruhende Bilder werden nicht ständig neu gezeichnet.

## Tests

Node.js 22 oder neuer, keine Pakete installieren:

```sh
node tools/embed.mjs --check
node tests/algorithms.mjs
node tests/runtime.mjs
node tests/ui.mjs
```

Oder `npm test` (ebenfalls ohne `npm install`).

### Ausgeführte Prüfungen

- **1456 Sortierfälle:** leere Eingabe, Einzelwerte, Nullwerte, gleiche Werte, gemischte Duplikate, alle vier Anordnungen mit Größen 20, 21, 80, 257, 500 und 1000 sowie 150 reproduzierbare Zufallsfälle. Gegen eine Referenzsortierung, zusätzlich Prüfung der endgültig markierten Positionen bei jedem Ereignis.
- **Stabilität:** identifizierbare, gleich große Werte für Bubble, Insertion, Merge und Counting. Counting erwartet im normalen Einsatz nichtnegative ganze Zahlen; die identifizierbaren Testobjekte lassen sich in diese umwandeln.
- **Operationsmodell:** bekannte kleine Beispiele, linearer Bestfall von Insertion und n(n−1)/2 Vergleiche von Selection.
- **Player/Worker:** vier parallel sortierte Listen mit 1000 Werten; unveränderte Originaldaten; genau gleiche Kosten in Player und Worker; fünf Zeiten, richtiger Median und sofortiger Abbruch. Der Browser-Worker-Code wird unverändert über einen Node-Worker-Adapter ausgeführt.
- **Rendering/Audio:** alle Ereignistypen, 1000 Balken, Größenanpassung und reduzierte Bewegung mit Testdoubles; stummer Anfang, explizite Freigabe, sechs Stimmen und Mute-Hüllkurve.
- **Steuerung:** die tatsächlich eingebettete Variante wurde mit einem kleinen DOM-Testdouble ausgeführt. Schritt, Reset, Start/Pause, Wechsel der Ansichten, Auswahlgrenzen, Unterrichtsaufgabe, Rangliste, Benchmark und alle Info-Schaltflächen geprüft. Dies prüft JavaScript-Verbindungen, nicht Browserlayout.
- **Lasttest mit nativem Skia Canvas:** 240 Frames, viermal 1000 Balken, vier gleichzeitige Generatoren, je 600 × 210 CSS-Pixel bei Pixeldichte 2. Nach Anpassung der Zeichenkoordinaten sank die mediane Zeichenzeit von etwa **15,7 ms auf 5,3 ms**. Rechenphase plus Zeichnen: Median **10,4 ms**, 95. Perzentil **21,4 ms** auf der bereitgestellten Laufzeit. Ein erzeugtes Bild der tatsächlichen Balkendarstellung wurde geprüft. Diese Werte sind eine CPU-/Raster-Messung, **keine zugesicherte 60-fps-Browsermessung**.

### Grenze der Verifikation

Ein lokaler Browser war nicht installiert. Der verfügbare Cloud-Browser erlaubt keine `file://`-Navigation; deshalb konnten dort weder Doppelklick-Start noch Desktop-/Mobilansicht geöffnet werden. Layout, reale Browser-Konsole, subjektive Klangqualität und echte Bildwiederholrate bleiben folglich im Zielbrowser zu prüfen. Es wurde kein Screenshot des vollständigen Browserlayouts vorgetäuscht. Die funktionalen Tests liefen ohne Fehler; reale Browserfehler lassen sich damit nicht vollständig ausschließen.

Praktische Abschlussprüfung auf dem Unterrichtsgerät: `index.html` öffnen, mit Tab bedienen, sehr langsam einen Tausch anschauen, Audio aktivieren, auf 1000 Balken und vier Verfahren wechseln, kurz schnell abspielen, pausieren und den Benchmark starten. Die Ansichten bei 390, 768 und 1440 Pixeln prüfen sowie reduzierte Bewegung in den Systemeinstellungen einschalten.

## Designbegründung

Die Seite folgt einem gedruckten Arbeitsblatt: warmes Papier, klare Druckfarbe und feine Trennlinien strukturieren das Experiment. Georgia gibt den großen Überschriften einen eigenständigen, ruhigen Charakter; der Systemstack hält die Bedienung vertraut und lädt keine Schrift nach. Monospace-Ziffern machen Zähler und Messwerte gut vergleichbar. Terrakotta kennzeichnet Schreibaktionen, Ocker Vergleiche und Waldgrün endgültige Ordnung. Diese drei Akzente werden von neutralen Flächen getragen; die Balken bleiben das visuelle Zentrum. Große Abstände und ein festes Raster trennen Eingabe, Beobachtung, Ergebnis und Erklärung, ohne ein austauschbares Kartenraster zu erzeugen. Zusätzliche Formen und Klartext sichern die Zustände auch ohne Farberkennung ab.

## Einen Algorithmus ergänzen

1. In `js/algorithms.js` einen Generator schreiben, der das übergebene Feld verändert und die bestehenden Ereignistypen ausgibt. Den Generator in `algorithms` aufnehmen; falls er Hilfsfunktionen nutzt, müssen diese auch in `algorithmWorkerSource` enthalten sein. Den Registry-Text am Ende dieser Quelle ebenfalls erweitern.
2. Einen Eintrag in `js/info.js` mit allen Kennwerten und lesbarem Pseudocode hinzufügen, außerdem eine Gewinnerbegründung in `explainWinner`. Angaben sollen zur tatsächlich implementierten Variante passen.
3. Die Auswahl und Info-Navigation werden automatisch aus `info` erzeugt. Neue Ereignistypen zusätzlich in Renderer, Audio und Textansicht erklären.
4. `node tools/embed.mjs` ausführen und `index.html` zusammen mit den Modulen committen. Das ist ein Wartungsschritt für Änderungen, kein Build für Nutzer oder Pages.
5. Tests ausführen; bei behaupteter Stabilität den Stabilitätstest erweitern. Die Ereignistests prüfen auch, ob eine Position zu früh als endgültig markiert wird.

## Bewusste Grenzen und Annahmen

- Das einzige sichtbare, leere Repository `sl3ndrr/ordnung-muss-sei` wurde als Ziel angenommen. Kleine, aussagekräftige Commits liegen auf `main`.
- Ein sorgfältig gestalteter Hellmodus statt eines zusätzlichen Dunkelmodus. Systemschriften statt Fontdateien. Keine Konten, kein Backend, keine Speicherung und keine externen Ressourcen.
- Maximal vier Teilnehmer für Übersicht und begrenzte Frame-Arbeit. Auf dem Smartphone stehen die Diagramme untereinander, laufen aber weiterhin gleichzeitig.
- Bei hohen Tempi werden viele Aktionen zwischen zwei Bildern verarbeitet und Töne ausgedünnt; **gezählt wird jede Aktion**. Bei langsamer Wiedergabe und Einzelschritten sind die Aktionen einzeln sichtbar. Die Bewegung interpoliert Balkenhöhen; sie simuliert keine einzelnen, fliegenden Sortierobjekte.
- Counting Sort ist für den kleinen, ganzzahligen Höhenbereich gewählt; Radix Sort wurde nicht zusätzlich aufgenommen. Quick Sort nutzt das mittlere Element als Pivot und eine Drei-Wege-Aufteilung. Shell Sort nutzt Knuth-Abstände. Heap Sort beendet das Absinken früh; bei gleichen Werten ist diese Variante linear.
- In-place meint konstante zusätzliche **Datenfelder**; der Quick-Sort-Rekursionsstapel wird im Speicherbedarf ausdrücklich genannt. Die O-Notation beschreibt Wachstum und ist keine exakte Zeitvorhersage.
- Die Operationsrangliste gewichtet Vergleich und Schreiben gleich. Auch Hilfsfeld-Schreiben zählen; Lesezugriffe, Indexberechnungen und reine Markierungen nicht. Der bekannte Wertebereich 0…n wird Counting Sort direkt übergeben, statt ihn mit einer zusätzlichen Maximumsuche zu ermitteln. Deshalb sind seine Vergleichszähler tatsächlich null. Bei direktem Generatoraufruf ohne Bereichsargument gilt der dokumentierte Standard 0…1000.
- Animationstempo ist eine Demonstration, keine Laufzeitmessung. Der Benchmark misst diese lesbaren Generatoren, keine separat optimierte Bibliotheksversion.

## Fachlicher Hintergrund

Die Kennwerte für die hier gewählte Knuth-Abstandsfolge wurden anhand der [Shell-Sort-Dokumentation von Sedgewick und Wayne (Princeton)](https://algs4.cs.princeton.edu/code/edu/princeton/cs/algs4/Shell.java.html) geprüft. Die [Princeton-Erklärung zur Drei-Wege-Aufteilung](https://algs4.cs.princeton.edu/23quicksort/) beschreibt den Vorteil bei gleichen Schlüsseln. Die Implementierungen hier sind eigenständig und liefern bewusst zusätzliche Unterrichtsereignisse; Kennwerte gelten für die angegebenen Varianten.
