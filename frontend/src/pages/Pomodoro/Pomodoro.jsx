import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, SkipForward, Leaf, Trash2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip,
} from "recharts";
import AppLayout from "../../components/layout/AppLayout";
import { useToast } from "../../components/Toast";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import { PageHeader, Card, Segmented, Button, Stats } from "../../components/ui";

const DURATIONS = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const CYCLE = 4; // focus sessions before a long break
const R = 132;
const CIRC = 2 * Math.PI * R;

const PLANTS = [
  { emoji: "🌱", name: "Sprout" }, { emoji: "🌸", name: "Cherry Blossom" }, { emoji: "🌻", name: "Sunflower" },
  { emoji: "🌹", name: "Rose" }, { emoji: "🌷", name: "Tulip" }, { emoji: "🍀", name: "Clover" },
  { emoji: "🌿", name: "Herb" }, { emoji: "🎋", name: "Bamboo" }, { emoji: "🌺", name: "Hibiscus" },
  { emoji: "🪴", name: "Potted Plant" }, { emoji: "🌳", name: "Oak Tree" }, { emoji: "🍄", name: "Mushroom" },
  { emoji: "🌼", name: "Daisy" }, { emoji: "🌾", name: "Wheat" }, { emoji: "🌵", name: "Cactus" },
  { emoji: "🍎", name: "Apple" }, { emoji: "🍊", name: "Orange" }, { emoji: "🍇", name: "Grapes" },
  { emoji: "🍓", name: "Strawberry" }, { emoji: "🍑", name: "Peach" }, { emoji: "☕", name: "Coffee" },
  { emoji: "🍵", name: "Matcha Tea" }, { emoji: "🧋", name: "Bubble Tea" },
];

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const loadGarden = () => readJSON("pomodoro_garden", []);
const saveGarden = (g) => writeJSON("pomodoro_garden", g);
const loadStats = () => readJSON("pomodoro_stats", { total: 0, streak: 0, lastDate: "" });
const saveStats = (s) => writeJSON("pomodoro_stats", s);
const loadClockEmoji = () => readJSON("pomodoro_clock_emoji", "🍅");
const loadClockImage = () => readJSON("pomodoro_clock_image", null);

function playDone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = "sine";
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  } catch { /* ignore */ }
}

// chart data
function dailyData(garden, days = 7) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ label: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }), sessions: garden.filter((p) => p.plantedAt.startsWith(ds)).length, isToday: i === 0 });
  }
  return out;
}
function weeklyData(garden, weeks = 6) {
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(); start.setDate(start.getDate() - start.getDay() - i * 7); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(end.getDate() + 6); end.setHours(23, 59, 59, 999);
    out.push({ label: i === 0 ? "This wk" : start.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sessions: garden.filter((p) => { const d = new Date(p.plantedAt); return d >= start && d <= end; }).length, isToday: i === 0 });
  }
  return out;
}
function monthlyData(garden, months = 6) {
  const out = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ label: d.toLocaleDateString("en-US", { month: "short" }), sessions: garden.filter((p) => { const pd = new Date(p.plantedAt); return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth(); }).length, isToday: i === 0 });
  }
  return out;
}

export default function Pomodoro() {
  const toast = useToast();
  const [tab, setTab] = useState("pomodoro");
  const [mode, setMode] = useState("focus");
  const [left, setLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [session, setSession] = useState(1); // 1..CYCLE
  const [garden, setGarden] = useState(loadGarden);
  const [stats, setStats] = useState(loadStats);
  const [chartView, setChartView] = useState("days");
  const [clockEmoji] = useState(loadClockEmoji);
  const [clockImage] = useState(loadClockImage);

  const max = DURATIONS[mode];
  const col = mode === "focus" ? "var(--c-clay)" : mode === "long" ? "var(--c-moss)" : "var(--c-sky)";

  const plantOne = useCallback(() => {
    const plant = { id: Date.now() + Math.random(), plantedAt: new Date().toISOString(), ...PLANTS[Math.floor(Math.random() * PLANTS.length)] };
    setGarden((prev) => { const next = [plant, ...prev]; saveGarden(next); return next; });
    setStats((prev) => {
      const today = todayStr();
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
      const streak = prev.lastDate === today ? prev.streak : prev.lastDate === yesterday ? prev.streak + 1 : 1;
      const ns = { total: prev.total + 1, streak, lastDate: today };
      saveStats(ns);
      return ns;
    });
  }, []);

  const advance = useCallback(() => {
    playDone();
    if (mode === "focus") {
      plantOne();
      const long = session % CYCLE === 0;
      setMode(long ? "long" : "short");
      setLeft(long ? DURATIONS.long : DURATIONS.short);
    } else {
      if (mode === "short" || mode === "long") {
        setSession((s) => (mode === "long" ? 1 : s + 1));
      }
      setMode("focus");
      setLeft(DURATIONS.focus);
    }
    setRunning(false);
  }, [mode, session, plantOne]);

  // tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) { clearInterval(id); advance(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, advance]);

  // Space shortcut
  useEffect(() => {
    if (tab !== "pomodoro") return;
    const onKey = (e) => {
      if (e.code !== "Space") return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setRunning((r) => !r);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab]);

  const selectMode = (m) => { setMode(m); setLeft(DURATIONS[m]); setRunning(false); };
  const reset = () => { setLeft(DURATIONS[mode]); setRunning(false); };

  const todayCount = garden.filter((p) => p.plantedAt.startsWith(todayStr())).length;
  const offset = CIRC * (1 - left / max);

  const chartData = chartView === "days" ? dailyData(garden, 7) : chartView === "weeks" ? weeklyData(garden, 6) : monthlyData(garden, 6);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Focus"
        title="One thing at a time."
        subtitle="25 minutes of focus, then a short break. Every finished session plants something in your garden."
        action={
          <Segmented ariaLabel="Timer type" role="tablist"
            options={[{ value: "pomodoro", label: "Pomodoro" }, { value: "timer", label: "Timer" }, { value: "stopwatch", label: "Stopwatch" }]}
            value={tab} onChange={setTab} />
        }
      />

      {tab === "pomodoro" ? (
        <>
          <div className="flex gap-6 flex-wrap items-stretch">
            {/* Timer */}
            <Card className="p-8 flex flex-col items-center" style={{ flex: "999 1 520px", minWidth: 0 }}>
              <Segmented ariaLabel="Mode" value={mode} onChange={selectMode}
                options={[{ value: "focus", label: "Focus · 25" }, { value: "short", label: "Short break · 5" }, { value: "long", label: "Long break · 15" }]} />

              <div className="my-7 relative">
                <svg width="300" height="300" viewBox="0 0 300 300" role="img" aria-label={`${fmt(left)} remaining`}>
                  <circle cx="150" cy="150" r={R} fill="none" stroke="var(--c-sunk)" strokeWidth="14" />
                  <circle cx="150" cy="150" r={R} fill="none" stroke={col} strokeWidth="14" strokeLinecap="round"
                    strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 150 150)"
                    style={{ transition: "stroke-dashoffset 1s linear" }} />
                  <text x="150" y="158" textAnchor="middle" fontSize="60" fontWeight="500" fill="var(--c-ink)" style={{ fontFamily: "var(--font-heading)" }}>{fmt(left)}</text>
                  <text x="150" y="192" textAnchor="middle" fontSize="14" fill="var(--c-ink3)" style={{ fontFamily: "var(--font-body)" }}>
                    {mode === "focus" ? `Session ${session} of ${CYCLE}` : "Break time"}
                  </text>
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 top-6 text-2xl">
                  {clockImage ? <img src={clockImage} alt="" className="w-7 h-7 rounded-full object-cover" /> : clockEmoji}
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                <button onClick={reset} aria-label="Reset" className="w-11 h-11 flex items-center justify-center rounded-ctl border border-line text-ink-2 hover:bg-sunk"><RotateCcw size={18} /></button>
                <Button onClick={() => setRunning((r) => !r)} icon={running ? Pause : Play}
                  className="min-h-[56px] px-9 text-base rounded-[14px]">
                  {running ? "Pause" : mode === "focus" ? "Start focus" : "Start break"}
                </Button>
                <button onClick={advance} aria-label="Skip" className="w-11 h-11 flex items-center justify-center rounded-ctl border border-line text-ink-2 hover:bg-sunk"><SkipForward size={18} /></button>
              </div>

              <div className="flex gap-2 mt-6" aria-label="Sessions until long break">
                {Array.from({ length: CYCLE }).map((_, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: i < session - 1 ? "var(--c-moss)" : "var(--c-line)" }} />
                ))}
              </div>
              <p className="text-[13px] text-ink-3 mt-5">Tip: press Space to start or pause.</p>
            </Card>

            {/* Side */}
            <aside className="flex flex-col gap-6" style={{ flex: "1 1 320px" }}>
              <Card className="p-6">
                <h2 className="font-semibold text-base mb-4">Today</h2>
                <Stats items={[
                  { value: todayCount, label: "sessions" },
                  { value: `${todayCount * 25}m`, label: "focused" },
                  { value: stats.streak, label: "day streak" },
                ]} />
              </Card>
              <Card className="p-6 flex-1">
                <div className="flex justify-between items-baseline mb-3.5">
                  <h2 className="font-semibold text-base">Focus garden</h2>
                  <span className="text-[13px] text-ink-3">{garden.length} grown</span>
                </div>
                {garden.length === 0 ? (
                  <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-[10px] bg-sunk border border-dashed border-line flex items-center justify-center text-ink-3/50"><Leaf size={14} /></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-2 max-h-[220px] overflow-y-auto">
                    {garden.map((p) => (
                      <div key={p.id} title={p.name} className="aspect-square rounded-[10px] bg-moss-t flex items-center justify-center text-lg">{p.emoji}</div>
                    ))}
                  </div>
                )}
                <p className="text-[13px] text-ink-3 mt-3.5">
                  {garden.length === 0 ? "Finish a session to plant your first seed." : `${todayCount} planted today`}
                </p>
                {garden.length > 0 && (
                  <button onClick={() => toast.confirm({ message: "Clear your entire garden? All plants will be lost.", confirmLabel: "Clear garden", onConfirm: () => { setGarden([]); saveGarden([]); } })}
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-clay-ink hover:underline"><Trash2 size={13} /> Clear garden</button>
                )}
              </Card>
            </aside>
          </div>

          {/* Chart */}
          <Card className="p-6 mt-6">
            <div className="flex justify-between items-center gap-3 flex-wrap mb-3">
              <h2 className="font-semibold text-base">Your focus</h2>
              <Segmented value={chartView} onChange={setChartView} ariaLabel="Chart range"
                options={[{ value: "days", label: "Week" }, { value: "weeks", label: "Month" }, { value: "months", label: "Year" }]} />
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="30%" margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--c-ink3)", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "var(--c-sunk)" }}
                    contentStyle={{ background: "var(--c-surface)", border: "1px solid var(--c-line)", borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="sessions" radius={[6, 6, 2, 2]}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.isToday ? "var(--c-moss)" : "var(--c-line)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : tab === "timer" ? (
        <BasicTimer />
      ) : (
        <Stopwatch />
      )}
    </AppLayout>
  );
}

// ── Simple countdown timer ──────────────────────────────────────────────────
function BasicTimer() {
  const [total, setTotal] = useState(5 * 60);
  const [left, setLeft] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [m, setM] = useState(5);
  const [s, setS] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((p) => (p <= 1 ? (clearInterval(id), 0) : p - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const apply = () => { const t = m * 60 + s; setTotal(t); setLeft(t); setRunning(false); };
  const offset = CIRC * (1 - left / (total || 1));

  return (
    <Card className="p-8 flex flex-col items-center max-w-2xl mx-auto">
      <div className="flex items-end gap-2 mb-6">
        <NumField label="Min" value={m} onChange={setM} max={180} />
        <span className="text-2xl pb-6">:</span>
        <NumField label="Sec" value={s} onChange={setS} max={59} />
        <Button variant="secondary" className="ml-3 mb-0" onClick={apply}>Set</Button>
      </div>
      <svg width="300" height="300" viewBox="0 0 300 300">
        <circle cx="150" cy="150" r={R} fill="none" stroke="var(--c-sunk)" strokeWidth="14" />
        <circle cx="150" cy="150" r={R} fill="none" stroke="var(--c-sky)" strokeWidth="14" strokeLinecap="round"
          strokeDasharray={CIRC} strokeDashoffset={offset} transform="rotate(-90 150 150)" style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x="150" y="162" textAnchor="middle" fontSize="60" fontWeight="500" fill="var(--c-ink)" style={{ fontFamily: "var(--font-heading)" }}>{fmt(left)}</text>
      </svg>
      <div className="flex items-center gap-3.5 mt-6">
        <button onClick={() => { setLeft(total); setRunning(false); }} aria-label="Reset" className="w-11 h-11 flex items-center justify-center rounded-ctl border border-line text-ink-2 hover:bg-sunk"><RotateCcw size={18} /></button>
        <Button onClick={() => setRunning((r) => !r)} icon={running ? Pause : Play} className="min-h-[56px] px-9 text-base rounded-[14px]">{running ? "Pause" : "Start"}</Button>
      </div>
    </Card>
  );
}

function NumField({ label, value, onChange, max }) {
  return (
    <label className="flex flex-col items-center gap-1">
      <span className="text-[13px] text-ink-3">{label}</span>
      <input type="number" min={0} max={max} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Number(e.target.value) || 0)))}
        className="w-20 h-12 text-center text-xl bg-white border border-line rounded-ctl outline-none focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
    </label>
  );
}

// ── Stopwatch ───────────────────────────────────────────────────────────────
function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!running) return;
    const start = Date.now() - ms;
    ref.current = setInterval(() => setMs(Date.now() - start), 50);
    return () => clearInterval(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const fmtSW = (t) => {
    const cs = Math.floor(t / 10) % 100, s = Math.floor(t / 1000) % 60, m = Math.floor(t / 60000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  };

  return (
    <Card className="p-10 flex flex-col items-center max-w-2xl mx-auto">
      <p className="font-serif text-[72px] font-medium text-ink tabular-nums">{fmtSW(ms)}</p>
      <div className="flex items-center gap-3.5 mt-6">
        <button onClick={() => { setMs(0); setRunning(false); setLaps([]); }} aria-label="Reset" className="w-11 h-11 flex items-center justify-center rounded-ctl border border-line text-ink-2 hover:bg-sunk"><RotateCcw size={18} /></button>
        <Button onClick={() => setRunning((r) => !r)} icon={running ? Pause : Play} className="min-h-[56px] px-9 text-base rounded-[14px]">{running ? "Pause" : "Start"}</Button>
        <button onClick={() => running && setLaps((l) => [ms, ...l])} className="h-11 px-4 rounded-ctl border border-line text-ink-2 hover:bg-sunk text-sm font-semibold">Lap</button>
      </div>
      {laps.length > 0 && (
        <div className="mt-6 w-full max-w-xs space-y-1">
          {laps.map((l, i) => (
            <div key={i} className="flex justify-between text-sm text-ink-2 border-b border-line py-1.5">
              <span>Lap {laps.length - i}</span><span className="tabular-nums">{fmtSW(l)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
