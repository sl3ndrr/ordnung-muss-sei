import { algorithmWorkerSource } from './algorithms.js';
function benchmarkWorker() {
  self.onmessage = ({ data: { input, ids } }) => {
    try {
      const results = [];
      // Rundlauf statt fünf identischer Läufe direkt hintereinander.
      for (let round = -1; round < 5; round++) {
        for (const id of ids) {
          const a = input.slice(); let comparisons = 0, writes = 0;
          const start = performance.now();
          for (const event of algorithms[id](a)) { comparisons += event.comparisons || 0; writes += event.writes || 0; }
          const elapsed = performance.now() - start;
          if (round === -1) results.push({ id, times: [], comparisons, writes });
          else results.find(r => r.id === id).times.push(elapsed);
        }
        self.postMessage({ progress: round + 2 });
      }
      results.forEach(r => { r.times.sort((a, b) => a - b); r.median = r.times[2]; });
      self.postMessage({ results });
    } catch (error) { self.postMessage({ error: error.message }); }
  };
}
export function runBenchmark(input, ids, onProgress) {
  const blob = new Blob([algorithmWorkerSource, '\n(', benchmarkWorker.toString(), ')();'], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob); const worker = new Worker(url);
  let settled = false;
  const cleanup = () => { worker.terminate(); URL.revokeObjectURL(url); };
  let rejectPromise;
  const promise = new Promise((resolve, reject) => {
    rejectPromise = reject;
    worker.onmessage = ({ data }) => {
      if (data.progress) onProgress(data.progress);
      if (data.results || data.error) {
        settled = true; cleanup();
        data.error ? reject(new Error(data.error)) : resolve(data.results);
      }
    };
    worker.onerror = () => { settled = true; cleanup(); reject(new Error('Der Benchmark-Worker konnte nicht starten. Bitte nutze einen aktuellen Browser.')); };
    worker.postMessage({ input, ids });
  });
  return { promise, cancel: () => { if (!settled) { settled = true; cleanup(); rejectPromise(new Error('Messung abgebrochen.')); } } };
}
