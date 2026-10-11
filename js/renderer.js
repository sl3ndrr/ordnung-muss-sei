export const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
export class BarRenderer {
  constructor(canvas, data) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.shown = Float32Array.from(data);
    this.fixed = new Set(); this.event = null; this.finishedAt = null; this.lastTime = 0;
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(canvas); this.resize();
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
    this.width = bounds.width; this.height = bounds.height;
    this.canvas.width = Math.round(bounds.width * dpr); this.canvas.height = Math.round(bounds.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  update(event) { this.event = event; if (event.type === 'fixed') event.indices.forEach(i => this.fixed.add(i)); }
  finish(now) { this.finishedAt = now; }
  draw(data, max, now, fast = false) {
    const { ctx, width: w, height: h } = this; if (!w || !h) return;
    const dt = Math.min(50, now - (this.lastTime || now - 16)); this.lastTime = now;
    const ease = motionPreference.matches || fast ? 1 : 1 - Math.exp(-dt / 65);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#dedbd0'; ctx.lineWidth = 1;
    for (const fraction of [0.25, 0.5, 0.75]) { const y = h - 20 - fraction * (h - 44); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const step = w / data.length, gap = data.length > 300 ? 0 : Math.min(2, step * 0.2);
    const active = new Set(this.event?.indices || []);
    for (let i = 0; i < data.length; i++) {
      this.shown[i] += (data[i] - this.shown[i]) * ease;
      const bh = Math.max(2, (this.shown[i] / max) * (h - 44)), x = i * step, y = h - 20 - bh;
      let color = this.fixed.has(i) ? '#386347' : '#45473c';
      if (active.has(i) && this.event.type !== 'fixed') color = this.event.type === 'compare' ? '#8a650d' : this.event.type === 'pivot' ? '#262820' : '#a6452d';
      if (this.finishedAt !== null) {
        const progress = (now - this.finishedAt) / (motionPreference.matches ? 200 : 650);
        color = '#386347';
        if (!motionPreference.matches && Math.abs(i / data.length - progress) < 0.06) color = '#8a650d';
      }
      ctx.fillStyle = color; ctx.fillRect(x, y, Math.max(0.5, step - gap), bh);
      // Formsignale zusätzlich zur Farbe: Kappe, Querstrich, Dreieck, Fußpunkt.
      if (active.has(i) && this.event.type !== 'fixed') {
        ctx.fillRect(x, Math.max(1, y - 5), Math.max(1, step - gap), 2);
        if (['swap', 'write'].includes(this.event.type)) { ctx.fillStyle = '#f5f2e9'; ctx.fillRect(x, y + 4, Math.max(1, step - gap), 2); }
        if (this.event.type === 'pivot') { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + step / 2, y - 5); ctx.lineTo(x + step, y - 10); ctx.fill(); }
      }
      if (this.fixed.has(i)) { ctx.fillStyle = '#386347'; ctx.fillRect(x, h - 13, Math.max(1, step - gap), 2); }
    }
  }
  destroy() { this.observer.disconnect(); }
}
