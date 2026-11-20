import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Moss & Paper tokens (driven by CSS variables so the theme
        //    switcher in SettingsContext can recolour the whole design) ──
        bg: "var(--c-bg)",
        surface: "var(--c-surface)",
        sunk: "var(--c-sunk)",
        line: "var(--c-line)",
        ink: {
          DEFAULT: "var(--c-ink)",
          2: "var(--c-ink2)",
          3: "var(--c-ink3)",
        },
        moss: {
          DEFAULT: "var(--c-moss)",
          d: "var(--c-moss-d)",
          t: "var(--c-moss-t)",
        },
        clay: {
          DEFAULT: "var(--c-clay)",
          t: "var(--c-clay-t)",
          ink: "var(--c-clay-ink)",
        },
        sky: {
          DEFAULT: "var(--c-sky)",
          t: "var(--c-sky-t)",
          ink: "var(--c-sky-ink)",
        },
        gold: "var(--c-gold)",
        recap: {
          bg: "var(--c-recap-bg)",
          fg: "var(--c-recap-fg)",
          mute: "var(--c-recap-mute)",
        },

        // ── Legacy palette kept so any not-yet-migrated markup still builds ──
        primary: {
          50: "var(--c-moss-t)",
          100: "var(--c-moss-t)",
          200: "var(--c-moss-t)",
          500: "var(--c-moss)",
          600: "var(--c-moss)",
          700: "var(--c-moss-d)",
          800: "var(--c-moss-d)",
          900: "var(--c-moss-d)",
        },
      },
      fontFamily: {
        serif: ["var(--font-heading)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        hero: "24px",
        ctl: "10px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(35,28,20,.08)",
        cover: "0 1px 2px rgba(35,28,20,.12), 0 6px 16px rgba(35,28,20,.08)",
        pola: "0 10px 24px rgba(0,0,0,.35)",
      },
    },
  },
  plugins: [forms, typography],
};
