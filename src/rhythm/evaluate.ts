const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const rhythmProgress = (at: number, seconds: number, duration = 1): number => clamp01((seconds - at) / duration);
export const beatPulse = (seconds: number, at: number): number => {
  const elapsed = Math.max(0, seconds - at);
  return Math.pow(Math.max(0, Math.sin(elapsed * Math.PI * 4)), 8);
};
