import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Upload, RotateCcw, Check, Save } from "lucide-react";
import { useSettings, THEMES, FONT_PAIRS } from "../../contexts/SettingsContext";

const G = {
  cream: "#f5f0e8",
  card: "#fdfcf8",
  border: "#d4c5a9",
  green: "#4e7e40",
  text: "#2a1f15",
  textMd: "#5a4a35",
  textSm: "#7a6a50",
};

function Section({ title, children }) {
  return (
    <div style={{ borderBottom: `1px solid ${G.border}`, paddingBottom: 20, marginBottom: 20 }}>
      <p style={{ fontFamily: "Lora,serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: G.textSm, marginBottom: 14 }}>
        ✦ {title} ✦
      </p>
      {children}
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, update, reset, panelOpen, setPanelOpen } = useSettings();
  const wpRef = useRef();
  const [confirmReset, setConfirmReset] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local draft — tracks unsaved changes
  const [draft, setDraft] = useState(settings);

  // Reset draft to current saved settings whenever panel opens
  useEffect(() => {
    if (panelOpen) {
      setDraft(settings);
      setConfirmReset(false);
      setSaved(false);
    }
  }, [panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = useCallback((p) => setDraft(prev => ({ ...prev, ...p })), []);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(settings);

  const handleSave = () => {
    update(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDiscard = () => {
    setDraft(settings);
  };

  const handleClose = () => {
    // Revert any preview — re-inject saved settings
    if (hasChanges) setDraft(settings);
    setPanelOpen(false);
  };

  const handleReset = () => {
    const defaults = {
      wallpaper: null,
      wallpaperOpacity: 12,
      themeId: "ghibli",
      fontPairId: "classic",
    };
    reset();
    setDraft(defaults);
    setConfirmReset(false);
  };

  if (!panelOpen) return null;

  const handleWallpaper = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => patch({ wallpaper: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(26,31,18,0.35)", backdropFilter: "blur(2px)" }}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(420px, 96vw)",
          background: G.card,
          borderLeft: `1.5px solid ${G.border}`,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.14)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: G.card, borderBottom: `1.5px solid ${G.border}` }}
        >
          <div>
            <h2 style={{ fontFamily: "Playfair Display,serif", fontWeight: 700, fontSize: "1.2rem", color: G.text }}>
              Site Settings ⚙️
            </h2>
            <p style={{ fontFamily: "Lora,serif", fontSize: 12, color: G.textSm, marginTop: 2 }}>
              Personalise your space
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: G.textMd }}
            onMouseEnter={e => e.currentTarget.style.background = G.cream}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── Wallpaper ── */}
          <Section title="Wallpaper">
            {draft.wallpaper ? (
              <div className="relative rounded-2xl overflow-hidden mb-3" style={{ aspectRatio: "16/7" }}>
                <img src={draft.wallpaper} alt="wallpaper preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.18)" }} />
                <button
                  onClick={() => patch({ wallpaper: null })}
                  className="absolute top-2 right-2 rounded-full p-1.5"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center py-8 mb-3 cursor-pointer"
                style={{ borderColor: G.border, background: G.cream }}
                onClick={() => wpRef.current.click()}
              >
                <div className="text-3xl mb-2">🖼️</div>
                <p style={{ fontFamily: "Lora,serif", fontSize: 13, color: G.textSm }}>Click to upload a background photo</p>
              </div>
            )}
            <input ref={wpRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaper} />

            <div className="flex gap-2">
              <button
                onClick={() => wpRef.current.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: G.cream, border: `1.5px solid ${G.border}`, color: G.textMd, fontFamily: "Lora,serif" }}
              >
                <Upload size={14} /> {draft.wallpaper ? "Change photo" : "Upload photo"}
              </button>
              {draft.wallpaper && (
                <button
                  onClick={() => patch({ wallpaper: null })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  style={{ fontFamily: "Lora,serif" }}
                >
                  Remove
                </button>
              )}
            </div>

            {draft.wallpaper && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <p style={{ fontFamily: "Lora,serif", fontSize: 12, color: G.textSm }}>Visibility</p>
                  <span style={{ fontFamily: "Lora,serif", fontSize: 12, fontWeight: 700, color: G.textMd }}>{draft.wallpaperOpacity}%</span>
                </div>
                <input
                  type="range" min={4} max={30} step={2}
                  value={draft.wallpaperOpacity}
                  onChange={e => patch({ wallpaperOpacity: Number(e.target.value) })}
                  className="w-full accent-green-600"
                />
              </div>
            )}
          </Section>

          {/* ── Colour theme ── */}
          <Section title="Colour Theme">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map(theme => {
                const t = theme.tokens;
                const primary = t["--c-moss"];
                const border = t["--c-line"];
                const active = draft.themeId === theme.id;
                return (
                <button
                  key={theme.id}
                  onClick={() => patch({ themeId: theme.id })}
                  className="relative rounded-2xl p-3 text-left transition-all"
                  style={{
                    background: t["--c-surface"],
                    border: `2px solid ${active ? primary : border}`,
                    boxShadow: active ? `0 0 0 3px ${primary}33` : "none",
                  }}
                >
                  <div className="flex gap-1 mb-2">
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: primary, display: "block", border: `1.5px solid ${border}` }} />
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: t["--c-clay"], display: "block", border: `1.5px solid ${border}` }} />
                    <span style={{ width: 18, height: 18, borderRadius: "50%", background: t["--c-bg"], display: "block", border: `1.5px solid ${border}` }} />
                  </div>
                  <p style={{ fontFamily: "'Fraunces',serif", fontSize: 11, fontWeight: 700, color: t["--c-ink"], lineHeight: 1.2 }}>
                    {theme.name}
                  </p>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 flex items-center justify-center" style={{ width: 18, height: 18, borderRadius: "50%", background: primary }}>
                      <Check size={10} color="#fff" strokeWidth={3} />
                    </span>
                  )}
                </button>
                );
              })}
            </div>
          </Section>

          {/* ── Typography ── */}
          <Section title="Typography">
            <div className="flex flex-col gap-2">
              {FONT_PAIRS.map(fp => (
                <button
                  key={fp.id}
                  onClick={() => patch({ fontPairId: fp.id })}
                  className="rounded-xl px-4 py-3 text-left transition-all"
                  style={{
                    background: draft.fontPairId === fp.id ? "#e8f5e2" : G.cream,
                    border: `1.5px solid ${draft.fontPairId === fp.id ? G.green : G.border}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontFamily: `'${fp.heading}', serif`, fontWeight: 700, fontSize: "1.05rem", color: G.text, marginBottom: 2, lineHeight: 1.2 }}>
                        {fp.name}
                      </p>
                      <p style={{ fontFamily: `'${fp.body}', serif`, fontSize: "0.78rem", color: G.textSm }}>
                        {fp.heading} / {fp.body}
                      </p>
                    </div>
                    {draft.fontPairId === fp.id && (
                      <span className="flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22, borderRadius: "50%", background: G.green }}>
                        <Check size={11} color="#fff" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          {/* ── Reset ── */}
          <div className="pb-4">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                style={{ color: G.textSm, background: G.cream, border: `1.5px solid ${G.border}`, fontFamily: "Lora,serif" }}
              >
                <RotateCcw size={14} /> Reset to defaults
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "#fff5f5", border: "1.5px solid #fca5a5" }}>
                <p style={{ fontFamily: "Lora,serif", fontSize: 13, color: "#7f1d1d", marginBottom: 10 }}>
                  Reset all settings to default?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background: "#dc2626", fontFamily: "Lora,serif" }}
                  >
                    Yes, reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: G.cream, border: `1.5px solid ${G.border}`, fontFamily: "Lora,serif", color: G.textMd }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sticky Save / Discard footer ── */}
        <div
          className="flex-shrink-0 px-6 py-4"
          style={{ borderTop: `1.5px solid ${G.border}`, background: G.card }}
        >
          {hasChanges && (
            <p className="text-center mb-3 text-xs" style={{ color: "#c9a84c", fontFamily: "Lora,serif", fontWeight: 600 }}>
              ✦ You have unsaved changes
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleDiscard}
              disabled={!hasChanges}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: G.cream,
                border: `1.5px solid ${G.border}`,
                color: hasChanges ? G.textMd : "#c8bfb0",
                fontFamily: "Lora,serif",
                cursor: hasChanges ? "pointer" : "not-allowed",
              }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
              style={{
                background: hasChanges ? G.green : "#a8c8a0",
                fontFamily: "Lora,serif",
                cursor: hasChanges ? "pointer" : "not-allowed",
                boxShadow: hasChanges ? "0 4px 14px rgba(78,126,64,0.35)" : "none",
              }}
            >
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
