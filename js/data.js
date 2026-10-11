export const arrangements = { random: 'Zufällig', nearly: 'Fast sortiert', reversed: 'Umgekehrt', duplicates: 'Viele Duplikate' };
export function randomGenerator(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function makeData(size, arrangement, seed = Date.now()) {
  const random = randomGenerator(seed);
  const data = Array.from({ length: size }, (_, i) => i + 1);
  if (arrangement === 'reversed') return data.reverse();
  if (arrangement === 'nearly') {
    // Wenige lokale Vertauschungen: fast sortiert, aber nicht ganz.
    for (let k = 0; k < Math.max(1, Math.floor(size / 12)); k++) {
      const i = Math.floor(random() * (size - 1)); [data[i], data[i + 1]] = [data[i + 1], data[i]];
    }
    return data;
  }
  if (arrangement === 'duplicates') for (let i = 0; i < size; i++) data[i] = (1 + Math.floor(random() * 8)) * Math.max(1, Math.floor(size / 8));
  for (let i = size - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [data[i], data[j]] = [data[j], data[i]]; }
  return data;
}
