import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

/** Original deterministic synthesized music. No recordings, external samples or network. */
const sampleRate = 48000;
const outputRoot = fileURLToPath(new URL("../public/audio/", import.meta.url));
const tau = Math.PI * 2;
const wave = (duration: number, sample: (seconds: number) => number) => {
  const length = Math.round(duration * sampleRate);
  const output = Buffer.alloc(44 + length * 2);
  output.write("RIFF", 0); output.writeUInt32LE(36 + length * 2, 4); output.write("WAVEfmt ", 8);
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24); output.writeUInt32LE(sampleRate * 2, 28);
  output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34); output.write("data", 36); output.writeUInt32LE(length * 2, 40);
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const value = Math.max(-0.94, Math.min(0.94, sample(i / sampleRate)));
    peak = Math.max(peak, Math.abs(value));
    output.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  return {output, peak};
};
const attack = (t: number) => Math.min(1, t / 0.003);
const kick = (t: number, weight: number, final = false): number => {
  if (t < 0 || t > (final ? 0.9 : 0.29)) return 0;
  // Analytical integral of a falling frequency avoids inconsistent sample-rate dependent pitch.
  const base = final ? 43 : 62;
  const start = final ? 126 : 105;
  const rate = final ? 21 : 29;
  const phase = tau * (base * t + (start - base) / rate * (1 - Math.exp(-rate * t)));
  const body = Math.sin(phase) * Math.exp(-t * (final ? 7 : 17));
  const overtone = Math.sin(phase * 2.01) * Math.exp(-t * 29) * 0.17;
  const snap = (Math.sin(tau * 1921 * t) + Math.sin(tau * 2747 * t)) * Math.exp(-t * 110) * (final ? 0.14 : 0.035);
  return (body + overtone + snap) * weight * attack(t);
};
const roll = wave(1.65, (t) => {
  const hits = [[0.04, 0.17], [0.24, 0.23], [0.42, 0.30], [0.58, 0.37]];
  const rolling = hits.reduce((sum, [at, strength]) => sum + kick(t - at, strength), 0);
  const slam = kick(t - 0.72, 0.76, true);
  const air = t < 0.72 ? Math.sin(tau * 119 * t) * 0.018 * Math.pow(t / 0.72, 3) : 0;
  return Math.tanh((rolling + slam + air) * 1.15) * 0.91;
});
// Frequencies and tremolo complete integer periods over eight seconds for a seamless loop.
const bed = wave(8, (t) => {
  const swell = 0.65 + Math.sin(tau * t / 8 - Math.PI / 2) * 0.16;
  const root = Math.sin(tau * 55 * t) * 0.24 + Math.sin(tau * 110 * t) * 0.06;
  const fifth = Math.sin(tau * 82.5 * t + Math.sin(tau * t / 8) * 0.18) * 0.08;
  const high = Math.sin(tau * 220 * t) * (0.025 + 0.012 * Math.sin(tau * t / 2));
  return (root + fifth + high) * swell;
});
await fs.mkdir(outputRoot, {recursive: true});
await fs.writeFile(path.join(outputRoot, "subject-expansion-roll.wav"), roll.output);
await fs.writeFile(path.join(outputRoot, "subject-expansion-bed.wav"), bed.output);
console.log(JSON.stringify({sampleRate, rollHitSeconds: 0.72, rollPeak: roll.peak, bedPeak: bed.peak, generated: ["subject-expansion-roll.wav", "subject-expansion-bed.wav"]}));
