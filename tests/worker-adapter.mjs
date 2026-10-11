import { Worker as NodeWorker } from 'node:worker_threads';
export class WorkerAdapter {
  constructor(url) {
    this.cancelled = false;
    this.ready = fetch(url).then(r => r.text()).then(source => {
      if (this.cancelled) return;
      this.worker = new NodeWorker(`const { parentPort } = require('node:worker_threads');\nconst self = { postMessage: data => parentPort.postMessage(data) };\n${source}\nparentPort.on('message', data => self.onmessage({ data }));`, { eval: true });
      this.worker.on('message', data => this.onmessage?.({ data }));
      this.worker.on('error', error => this.onerror?.(error));
    });
  }
  postMessage(data) { this.ready.then(() => { if (!this.cancelled) this.worker.postMessage(data); }); }
  terminate() { this.cancelled = true; this.worker?.terminate(); }
}
