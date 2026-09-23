export type AiHotOpeningItemLayout = {
  text: string;
  left: number;
  top: number;
  width: number;
  accent: string;
  side: "left" | "right";
};

const WIDTH = 1920;
const CENTER_X = 960;
const CENTER_Y = 520;
const RADIUS_X = 620;
const RADIUS_Y = 620;
const BUTTON_HEIGHT = 96;

const ANGLES: Record<number, readonly number[]> = {
  1: [0],
  2: [180, 0],
  3: [210, 330, 180],
  4: [210, 330, 150, 30],
  5: [210, 330, 180, 0, 150],
  6: [210, 330, 180, 0, 150, 30],
};

const ACCENTS = ["#72e7ff", "#ff79b6", "#9a8cff", "#7cebbf", "#ffcf76", "#ff9478"] as const;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const textUnits = (text: string): number => Array.from(text).reduce(
  (total, character) => total + (/^[\u0000-\u00ff]$/.test(character) ? 0.58 : 1),
  0,
);

const widthForText = (text: string): number =>
  Math.round(clamp(220 + textUnits(text) * 25, 460, 620));

export const layoutAiHotOpeningItems = (items: readonly string[]): AiHotOpeningItemLayout[] => {
  const angles = ANGLES[items.length];
  if (!angles) throw new Error("AI hot opening supports 1-6 items");
  return items.map((text, index) => {
    const radians = angles[index] * Math.PI / 180;
    const centerX = CENTER_X + Math.cos(radians) * RADIUS_X;
    const centerY = CENTER_Y + Math.sin(radians) * RADIUS_Y;
    const width = widthForText(text);
    const side = Math.cos(radians) < 0 ? "left" : "right";
    return {
      text,
      left: Math.round(clamp(centerX - width / 2, 40, WIDTH - width - 40)),
      top: Math.round(centerY - BUTTON_HEIGHT / 2),
      width,
      accent: ACCENTS[index % ACCENTS.length],
      side,
    };
  });
};
