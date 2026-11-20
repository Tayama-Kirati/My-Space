import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { readJSON, writeJSON } from "../utils/authPersistence";

// ── Theme presets ───────────────────────────────────────────────────────────
// Each theme sets the full "Moss & Paper" token set. "ghibli" (Moss & Paper) is
// the default; the others are best-effort recolours onto the same tokens.
export const THEMES = [
  {
    id: "ghibli",
    name: "Moss & Paper",
    tokens: {
      "--c-bg": "#f7f3ea", "--c-surface": "#fffdf8", "--c-sunk": "#f0eadd", "--c-line": "#e4d9c6",
      "--c-ink": "#231c14", "--c-ink2": "#54483a", "--c-ink3": "#6b5e4e",
      "--c-moss": "#3e6b39", "--c-moss-d": "#2f5530", "--c-moss-t": "#e6eedd",
      "--c-clay": "#a9512b", "--c-clay-t": "#f6e5da", "--c-clay-ink": "#8a3f1f",
      "--c-sky": "#2f5d8a", "--c-sky-t": "#e2ecf5", "--c-sky-ink": "#244b70",
      "--c-gold": "#9a6f18",
      "--c-recap-bg": "#2a231b", "--c-recap-fg": "#f3ede2", "--c-recap-mute": "#cfc3af",
    },
  },
  {
    id: "ocean",
    name: "Ocean Blue",
    tokens: {
      "--c-bg": "#f0f4f8", "--c-surface": "#fdfeff", "--c-sunk": "#e4edf5", "--c-line": "#c7dbe8",
      "--c-ink": "#16222e", "--c-ink2": "#3b4a58", "--c-ink3": "#5a6b78",
      "--c-moss": "#2e5aa8", "--c-moss-d": "#1e3f7f", "--c-moss-t": "#dbeafe",
      "--c-clay": "#2f6d8a", "--c-clay-t": "#d8ecf4", "--c-clay-ink": "#1d4c63",
      "--c-sky": "#4a90d9", "--c-sky-t": "#e2f0fb", "--c-sky-ink": "#235a92",
      "--c-gold": "#b07d14",
      "--c-recap-bg": "#182537", "--c-recap-fg": "#eef4fb", "--c-recap-mute": "#aec2d6",
    },
  },
  {
    id: "sakura",
    name: "Sakura Pink",
    tokens: {
      "--c-bg": "#fef5f7", "--c-surface": "#fffbfc", "--c-sunk": "#fbe6ec", "--c-line": "#f4ccd6",
      "--c-ink": "#2d1820", "--c-ink2": "#584049", "--c-ink3": "#75606a",
      "--c-moss": "#b05070", "--c-moss-d": "#8e3050", "--c-moss-t": "#fce4ec",
      "--c-clay": "#c56a4d", "--c-clay-t": "#f8e3da", "--c-clay-ink": "#9c4a30",
      "--c-sky": "#8a5ea8", "--c-sky-t": "#efe6f6", "--c-sky-ink": "#5f3f78",
      "--c-gold": "#b07d14",
      "--c-recap-bg": "#2d1a22", "--c-recap-fg": "#fbeef2", "--c-recap-mute": "#d6b7c2",
    },
  },
  {
    id: "autumn",
    name: "Autumn Ember",
    tokens: {
      "--c-bg": "#fef3e8", "--c-surface": "#fffaf5", "--c-sunk": "#f8e6d2", "--c-line": "#e8cda9",
      "--c-ink": "#2a1c10", "--c-ink2": "#574434", "--c-ink3": "#75604e",
      "--c-moss": "#c55a14", "--c-moss-d": "#a04010", "--c-moss-t": "#fff3e0",
      "--c-clay": "#9a6b2f", "--c-clay-t": "#f3e4cf", "--c-clay-ink": "#744d1d",
      "--c-sky": "#3e7d6b", "--c-sky-t": "#e0efe9", "--c-sky-ink": "#285a4c",
      "--c-gold": "#9a6f18",
      "--c-recap-bg": "#2a1d10", "--c-recap-fg": "#fbefe0", "--c-recap-mute": "#d4bf9f",
    },
  },
  {
    id: "lavender",
    name: "Lavender Mist",
    tokens: {
      "--c-bg": "#f5f0ff", "--c-surface": "#fdfbff", "--c-sunk": "#eae2fb", "--c-line": "#d6c8ee",
      "--c-ink": "#201a2e", "--c-ink2": "#473f58", "--c-ink3": "#655c78",
      "--c-moss": "#7c5cbf", "--c-moss-d": "#5e3fa0", "--c-moss-t": "#ede9fe",
      "--c-clay": "#a65c8a", "--c-clay-t": "#f3e2ee", "--c-clay-ink": "#7c3f66",
      "--c-sky": "#4a6fd9", "--c-sky-t": "#e4e9fb", "--c-sky-ink": "#2d4692",
      "--c-gold": "#9a6f18",
      "--c-recap-bg": "#211a2e", "--c-recap-fg": "#f1ecfb", "--c-recap-mute": "#c4b7d6",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    tokens: {
      "--c-bg": "#15192b", "--c-surface": "#1d2336", "--c-sunk": "#272e45", "--c-line": "#353f5c",
      "--c-ink": "#eef1f8", "--c-ink2": "#c2c9db", "--c-ink3": "#9aa3bd",
      "--c-moss": "#5ba3e8", "--c-moss-d": "#7bb6ef", "--c-moss-t": "#24314a",
      "--c-clay": "#e08a5a", "--c-clay-t": "#3a2c22", "--c-clay-ink": "#f0b48c",
      "--c-sky": "#64b5c9", "--c-sky-t": "#1f3440", "--c-sky-ink": "#9ad7e5",
      "--c-gold": "#e0b94a",
      "--c-recap-bg": "#0f1320", "--c-recap-fg": "#eef1f8", "--c-recap-mute": "#8b93ab",
    },
  },
];

// ── Font pairings ───────────────────────────────────────────────────────────
export const FONT_PAIRS = [
  {
    id: "classic", name: "Paper Classic",
    heading: "Fraunces", body: "Inter",
    url: null, // loaded in index.html
  },
  {
    id: "cormorant", name: "Cormorant",
    heading: "Cormorant Garamond", body: "Crimson Pro",
    url: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap",
  },
  {
    id: "merriweather", name: "Merriweather",
    heading: "Merriweather", body: "Source Serif 4",
    url: "https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap",
  },
  {
    id: "garamond", name: "EB Garamond",
    heading: "EB Garamond", body: "Libre Baskerville",
    url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
  },
  {
    id: "dm", name: "DM Modern",
    heading: "DM Serif Display", body: "DM Sans",
    url: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&display=swap",
  },
];

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  wallpaper: null,
  wallpaperOpacity: 12,
  themeId: "ghibli",
  fontPairId: "classic",
};

// ── CSS injection ───────────────────────────────────────────────────────────
function injectSettings(settings) {
  const theme = THEMES.find((t) => t.id === settings.themeId) || THEMES[0];
  const fp = FONT_PAIRS.find((f) => f.id === settings.fontPairId) || FONT_PAIRS[0];
  const root = document.documentElement;

  // Colour tokens
  Object.entries(theme.tokens).forEach(([k, v]) => root.style.setProperty(k, v));

  // Fonts
  root.style.setProperty("--font-heading", `'${fp.heading}', Georgia, serif`);
  root.style.setProperty("--font-body", `'${fp.body}', system-ui, sans-serif`);

  // Load extra font stylesheet if needed
  let linkEl = document.getElementById("_sf_fonts");
  if (fp.url) {
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.id = "_sf_fonts";
      linkEl.rel = "stylesheet";
      document.head.appendChild(linkEl);
    }
    linkEl.href = fp.url;
  } else if (linkEl) {
    linkEl.remove();
  }

  // Wallpaper
  const opacity = Math.max(0, Math.min(30, settings.wallpaperOpacity || 12)) / 100;
  const css = settings.wallpaper
    ? `body::before{content:'';position:fixed;inset:0;background:url('${settings.wallpaper}') center/cover no-repeat;opacity:${opacity};z-index:-1;pointer-events:none;}`
    : `body::before{content:none !important;}`;

  let styleEl = document.getElementById("_sf_styles");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "_sf_styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
}

// ── Context ─────────────────────────────────────────────────────────────────
const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULTS,
    ...readJSON("site_settings", {}),
  }));
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    injectSettings(settings);
  }, [settings]);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeJSON("site_settings", next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    writeJSON("site_settings", DEFAULTS);
    setSettings(DEFAULTS);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update, reset, panelOpen, setPanelOpen }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
