export class SortAudio {
  constructor() { this.enabled = false; this.volume = 0.18; this.voices = 0; this.last = -1; }
  async toggle() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) throw new Error('Dieser Browser unterstützt Web Audio nicht.');
      this.context = new Context();
      this.master = this.context.createGain(); this.master.gain.value = this.volume;
      const compressor = this.context.createDynamicsCompressor();
      this.master.connect(compressor); compressor.connect(this.context.destination);
    }
    await this.context.resume(); this.enabled = !this.enabled;
    this.master.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.context.currentTime, 0.02);
    return this.enabled;
  }
  setVolume(value) { this.volume = value; if (this.master) this.master.gain.setTargetAtTime(this.enabled ? value : 0, this.context.currentTime, 0.02); }
  tone(height, max, delay = 0, duration = 0.12) {
    if (!this.enabled || this.voices >= 6) return;
    const ctx = this.context; const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = 160 * Math.pow(2, 2 * Math.min(1, height / max));
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.16, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain); gain.connect(this.master); this.voices++;
    oscillator.onended = () => { this.voices--; oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + 0.01);
  }
  play(event, data, max) {
    if (!this.enabled || !['compare', 'swap', 'write'].includes(event.type)) return;
    // Höchstens 25 Tonpaare pro Sekunde, auch bei sehr vielen Schritten.
    const now = this.context.currentTime; if (now - this.last < 0.04) return; this.last = now;
    const heights = event.values || event.indices.map(i => data[i]);
    heights.slice(0, 2).forEach(height => this.tone(height, max));
  }
  finish() { [0.25, 0.5, 0.75].forEach((v, i) => this.tone(v, 1, i * 0.11, 0.22)); }
}
