import { algorithms, countEvent } from './algorithms.js';
// Der Player kennt weder Canvas noch Tempo. Jeder Aufruf gibt allen einen Schritt.
export class Experiment {
  constructor(input, ids) {
    this.runs = ids.map(id => {
      const data = input.slice();
      return { id, data, generator: algorithms[id](data, input.length), comparisons: 0, writes: 0, event: null, done: false };
    });
  }
  step() {
    const changed = [];
    for (const run of this.runs) {
      if (run.done) continue;
      const next = run.generator.next();
      if (next.done) run.done = true;
      else { run.event = next.value; countEvent(run, next.value); }
      changed.push(run);
    }
    return changed;
  }
  get finished() { return this.runs.every(run => run.done); }
}
