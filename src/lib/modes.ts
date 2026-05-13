export type ModeId = "gn2" | "gn35" | "gn-flash" | "gn-pro";

export interface Mode {
  id: ModeId;
  name: string;
  tag: string;
  description: string;
  imageLimit: number; // 0 = none
  model: string;
  pro: boolean;
}

export const MODES: Mode[] = [
  {
    id: "gn2",
    name: "Gn 2.0",
    tag: "Normal",
    description: "Balanced everyday assistant. 3 free images per day.",
    imageLimit: 3,
    model: "google/gemini-2.5-flash-lite",
    pro: false,
  },
  {
    id: "gn35",
    name: "Gn 3.5",
    tag: "Super",
    description: "Faster and smarter. 10 free images per day.",
    imageLimit: 10,
    model: "google/gemini-3-flash-preview",
    pro: false,
  },
  {
    id: "gn-flash",
    name: "Gn Flash 6",
    tag: "Pro",
    description: "Super speed, full features, no daily limits.",
    imageLimit: 9999,
    model: "google/gemini-2.5-pro",
    pro: true,
  },
  {
    id: "gn-pro",
    name: "Gn Pro",
    tag: "Pro",
    description: "Top-tier reasoning for code, research and analysis.",
    imageLimit: 9999,
    model: "openai/gpt-5",
    pro: true,
  },
];

export const getMode = (id: string): Mode =>
  MODES.find((m) => m.id === id) ?? MODES[0];
