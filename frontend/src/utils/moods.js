// Named moods for the "Moss & Paper" redesign, with the colour dots from the
// design handoff. Legacy journal entries stored moods as emoji, so
// normalizeMood() maps those to names while leaving already-named moods intact.

export const MOODS = [
  { name: "Happy", dot: "#D19A2A" },
  { name: "Calm", dot: "#5B8DB8" },
  { name: "Loved", dot: "#C4677A" },
  { name: "Excited", dot: "#D07436" },
  { name: "Tired", dot: "#8C8273" },
  { name: "Sad", dot: "#5E6E8C" },
  { name: "Anxious", dot: "#8E6BB0" },
  { name: "Frustrated", dot: "#B84B3B" },
];

const NAME_SET = new Set(MOODS.map((m) => m.name));
const COLOR = Object.fromEntries(MOODS.map((m) => [m.name, m.dot]));

const EMOJI_TO_NAME = {
  "😊": "Happy", "🙂": "Happy", "😄": "Happy",
  "😐": "Calm", "😌": "Calm",
  "🥰": "Loved", "❤️": "Loved", "😍": "Loved",
  "🤩": "Excited",
  "😴": "Tired",
  "😢": "Sad", "😞": "Sad", "😔": "Sad",
  "😰": "Anxious", "😟": "Anxious", "😨": "Anxious",
  "😤": "Frustrated", "😠": "Frustrated", "😡": "Frustrated",
};

/** Map any stored mood value (emoji or name) to a canonical name, or "". */
export function normalizeMood(value) {
  if (!value) return "";
  if (NAME_SET.has(value)) return value;
  if (EMOJI_TO_NAME[value]) return EMOJI_TO_NAME[value];
  return value; // preserve unknown custom strings
}

/** Colour for a mood value (emoji or name). Falls back to a neutral tone. */
export function moodColor(value) {
  const name = normalizeMood(value);
  return COLOR[name] || "#8C8273";
}
