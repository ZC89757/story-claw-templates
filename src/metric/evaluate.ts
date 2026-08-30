const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export const metricProgress = (at: number, seconds: number): number => clamp01((seconds - at) / 0.6);
export const easeOut = (value: number): number => 1 - Math.pow(1 - clamp01(value), 3);

export const numericValue = (value: string): number | undefined => {
  const match = value.replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const formatNumeric = (value: number, source: string): string => {
  const match = source.replace(/,/g, "").match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return source;
  const raw = match[0];
  const decimals = raw.includes(".") ? raw.length - raw.indexOf(".") - 1 : 0;
  const number = decimals ? value.toFixed(decimals) : String(Math.round(value));
  return source.replace(raw, number);
};
