export const info = {
  bubble: { name: 'Bubble Sort', short: 'Nachbarn vergleichen', idea: 'Zwei Nachbarn werden verglichen. Steht der größere links, tauschen sie ihre Plätze. So wandert der größte Wert in jeder Runde ans rechte Ende.', best: 'O(n)', average: 'O(n²)', worst: 'O(n²)', memory: 'O(1)', stable: true, inplace: true, use: 'Anschaulich zum Einstieg. Bei großen unsortierten Listen sind Merge Sort oder Heap Sort deutlich sparsamer.', code: 'für jedes noch unsortierte Ende:\n  vergleiche alle Nachbarpaare\n  tausche, wenn links größer\n  höre auf, wenn nichts getauscht wurde' }
};
