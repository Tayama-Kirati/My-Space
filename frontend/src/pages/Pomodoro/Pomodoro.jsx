import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Leaf,
  Trophy,
  Flame,
  BarChart2,
} from "lucide-react";
import { useToast } from "../../components/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { readJSON, writeJSON } from "../../utils/authPersistence";

// ── Timer modes ───────────────────────────────────────────────────────────
const MODE_MAX = { focus: 60 * 60, short: 15 * 60, long: 30 * 60 }; // max seconds
const MODE_DEFAULT = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
const MODE_COLOR = {
  focus: {
    ring: "#2e5aa8",
    bg: "from-primary-700 to-primary-500",
    soft: "#dbeafe",
  },
  short: {
    ring: "#16a34a",
    bg: "from-green-700 to-green-500",
    soft: "#dcfce7",
  },
  long: { ring: "#0d9488", bg: "from-teal-700 to-teal-500", soft: "#ccfbf1" },
};

// ── Garden items — plants + food rewards ─────────────────────────────────
const PLANTS = [
  // Plants & nature
  { emoji: "🌱", name: "Sprout" },
  { emoji: "🌸", name: "Cherry Blossom" },
  { emoji: "🌻", name: "Sunflower" },
  { emoji: "🌹", name: "Rose" },
  { emoji: "🌷", name: "Tulip" },
  { emoji: "🍀", name: "Clover" },
  { emoji: "🌿", name: "Herb" },
  { emoji: "🎋", name: "Bamboo" },
  { emoji: "🌺", name: "Hibiscus" },
  { emoji: "🪴", name: "Potted Plant" },
  { emoji: "🌳", name: "Oak Tree" },
  { emoji: "🍄", name: "Mushroom" },
  { emoji: "🌼", name: "Daisy" },
  { emoji: "🌾", name: "Wheat" },
  { emoji: "🌵", name: "Cactus" },
  { emoji: "🎍", name: "Pine Deco" },
  // Fruits
  { emoji: "🍎", name: "Apple" },
  { emoji: "🍊", name: "Orange" },
  { emoji: "🍋", name: "Lemon" },
  { emoji: "🍇", name: "Grapes" },
  { emoji: "🍓", name: "Strawberry" },
  { emoji: "🫐", name: "Blueberry" },
  { emoji: "🍑", name: "Peach" },
  { emoji: "🍒", name: "Cherry" },
  { emoji: "🍍", name: "Pineapple" },
  { emoji: "🥝", name: "Kiwi" },
  { emoji: "🍉", name: "Watermelon" },
  { emoji: "🫒", name: "Olive" },
  // Sweets & snacks
  { emoji: "🍰", name: "Cake Slice" },
  { emoji: "🧁", name: "Cupcake" },
  { emoji: "🍩", name: "Donut" },
  { emoji: "🍪", name: "Cookie" },
  { emoji: "🍫", name: "Chocolate" },
  { emoji: "🧇", name: "Waffle" },
  { emoji: "🍡", name: "Dango" },
  { emoji: "🍢", name: "Oden" },
  { emoji: "🎂", name: "Birthday Cake" },
  { emoji: "🍮", name: "Pudding" },
  // Ghibli-vibe foods
  { emoji: "🍜", name: "Ramen" },
  { emoji: "🍱", name: "Bento Box" },
  { emoji: "🍙", name: "Rice Ball" },
  { emoji: "🥟", name: "Dumpling" },
  { emoji: "🍣", name: "Sushi" },
  { emoji: "🍤", name: "Tempura" },
  // Drinks
  { emoji: "☕", name: "Coffee" },
  { emoji: "🍵", name: "Matcha Tea" },
  { emoji: "🧋", name: "Bubble Tea" },
  { emoji: "🍶", name: "Sake" },
];

// ── SVG ring constants ────────────────────────────────────────────────────
const CX = 160,
  CY = 160,
  R = 130;
const CIRC = 2 * Math.PI * R;

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtTime = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const fmtMin = (s) => `${Math.round(s / 60)} min`;

function loadGarden() {
  return readJSON("pomodoro_garden", []);
}
function saveGarden(g) {
  writeJSON("pomodoro_garden", g);
}
function loadStats() {
  return readJSON("pomodoro_stats", { total: 0, streak: 0, lastDate: "" });
}
function saveStats(s) {
  writeJSON("pomodoro_stats", s);
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function shortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function playDone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.15 + 0.4,
      );
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.5);
    });
  } catch {}
}

// Convert SVG point → angle (0 at 12-o'clock, clockwise)
function pointToAngle(x, y) {
  let a = Math.atan2(y - CY, x - CX) + Math.PI / 2;
  if (a < 0) a += 2 * Math.PI;
  return a;
}
// angle → handle position on ring
function angleToPos(a) {
  return { x: CX + R * Math.sin(a), y: CY - R * Math.cos(a) };
}

// ── Chart helpers ─────────────────────────────────────────────────────────
function getDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function getDailyData(garden, days = 7) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = getDateStr(d);
    result.push({
      label:
        i === 0
          ? "Today"
          : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sessions: garden.filter((p) => p.plantedAt.startsWith(ds)).length,
      isToday: i === 0,
    });
  }
  return result;
}
function getWeeklyData(garden, weeks = 6) {
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const sessions = garden.filter((p) => {
      const d = new Date(p.plantedAt);
      return d >= start && d <= end;
    }).length;
    result.push({
      label:
        i === 0
          ? "This week"
          : start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
      sessions,
      isToday: i === 0,
    });
  }
  return result;
}

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fdfcf8",
        border: "1.5px solid #d4c5a9",
        borderRadius: 10,
        padding: "8px 14px",
        fontFamily: "Lora, serif",
      }}
    >
      <p style={{ fontSize: "0.78rem", color: "#7a6a50", marginBottom: 2 }}>
        {label}
      </p>
      <p style={{ fontSize: "1rem", fontWeight: 700, color: "#4e7e40" }}>
        {payload[0].value} session{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Pomodoro() {
  const [mode, setMode] = useState("focus");
  const [maxTime, setMaxTime] = useState(MODE_DEFAULT.focus);
  const [timeLeft, setTimeLeft] = useState(MODE_DEFAULT.focus);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cycleDone, setCycleDone] = useState(0); // sessions in current 4-cycle
  const [garden, setGarden] = useState(loadGarden);
  const [stats, setStats] = useState(loadStats);
  const [newPlantId, setNewPlantId] = useState(null);
  const [chartView, setChartView] = useState("days"); // 'days' | 'weeks'
  const toast = useToast();

  const svgRef = useRef(null);
  const intervalRef = useRef(null);
  const col = MODE_COLOR[mode];

  // ── getSVGCoords ──────────────────────────────────────────────────────
  const getSVGCoords = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: CX, y: CY };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (320 / rect.width),
      y: (clientY - rect.top) * (320 / rect.height),
    };
  }, []);

  // ── plantNew ─────────────────────────────────────────────────────────
  const plantNew = useCallback(() => {
    const p = {
      id: Date.now(),
      ...PLANTS[Math.floor(Math.random() * PLANTS.length)],
      plantedAt: new Date().toISOString(),
      session: stats.total + 1,
    };
    const updated = [p, ...garden];
    setGarden(updated);
    saveGarden(updated);
    setNewPlantId(p.id);
    setTimeout(() => setNewPlantId(null), 3000);
    const today = todayStr();
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })();
    const streak =
      stats.lastDate === today || stats.lastDate === yesterday
        ? stats.streak + 1
        : 1;
    const ns = { total: stats.total + 1, streak, lastDate: today };
    setStats(ns);
    saveStats(ns);
  }, [garden, stats]);

  // ── switchMode ────────────────────────────────────────────────────────
  const switchMode = useCallback((m) => {
    setMode(m);
    const t = MODE_DEFAULT[m];
    setMaxTime(t);
    setTimeLeft(t);
    setRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  // ── Timer tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            playDone();
            if (mode === "focus") {
              plantNew();
              const next = (cycleDone + 1) % 4;
              setCycleDone(next);
              setTimeout(() => switchMode(next === 0 ? "long" : "short"), 600);
            } else {
              setTimeout(() => switchMode("focus"), 600);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, cycleDone, plantNew, switchMode]);

  // ── Drag handlers ─────────────────────────────────────────────────────
  const onDragStart = (e) => {
    if (running) return;
    e.preventDefault();
    setDragging(true);
  };

  const onDragMove = useCallback(
    (e) => {
      if (!dragging || running) return;
      const { x, y } = getSVGCoords(e);
      const angle = pointToAngle(x, y);
      const fraction = angle / (2 * Math.PI);
      const max = MODE_MAX[mode];
      const secs = Math.max(60, Math.round((fraction * max) / 60) * 60);
      setMaxTime(secs);
      setTimeLeft(secs);
    },
    [dragging, running, mode, getSVGCoords],
  );

  const onDragEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  // ── Ring calc ─────────────────────────────────────────────────────────
  const progress = maxTime > 0 ? timeLeft / maxTime : 0;
  const dashOffset = CIRC * (1 - progress);
  const handleAngle = progress * 2 * Math.PI;
  const handle = angleToPos(handleAngle);
  const todayCount = garden.filter((p) =>
    p.plantedAt.startsWith(todayStr()),
  ).length;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#f5f0e8" }}
    >
      <Navbar />

      {/* Hero banner — Ghibli illustrated */}
      <section
        className="relative overflow-hidden py-14 transition-all duration-700"
        style={{
          background: `
          radial-gradient(ellipse 220px 85px at 12% 22%, #fff 0%, transparent 70%),
          radial-gradient(ellipse 170px 65px at 76% 18%, #fffdf9 0%, transparent 70%),
          radial-gradient(ellipse 80% 26% at 50% 76%, #8cbd7e 0%, transparent 55%),
          radial-gradient(ellipse 52% 34% at 6%  88%, #4e9140 0%, transparent 55%),
          radial-gradient(ellipse 52% 34% at 94% 88%, #4e9140 0%, transparent 55%),
          linear-gradient(180deg, ${col.ring}cc 0%, ${col.ring}88 30%, #cceaf9 60%, #e5f8fe 78%, #f5f0e8 100%)`,
        }}
      >
        <div className="container-fluid text-center relative z-10">
          <h1
            className="text-5xl font-bold mb-2"
            style={{
              fontFamily: "Playfair Display, serif",
              color: "#1a3a12",
              textShadow: "0 2px 16px rgba(255,255,255,0.5)",
            }}
          >
            Focus Garden
          </h1>
          <p style={{ color: "#2a4a20", fontFamily: "Lora, serif" }}>
            Drag the ring to set your time · Complete sessions to grow your
            garden
          </p>
        </div>
      </section>

      <main className="container-fluid py-10 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
          {/* ── Timer column ─────────────────────────────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-5">
            {/* Mode tabs */}
            <div
              className="rounded-2xl p-2 flex gap-1 shadow-sm"
              style={{ background: "#fdfcf8", border: "1.5px solid #d4c5a9" }}
            >
              {["focus", "short", "long"].map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className="flex-1 py-2 px-2 rounded-xl text-sm font-semibold transition-all capitalize"
                  style={
                    mode === m
                      ? {
                          background: col.ring,
                          color: "#fff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          fontFamily: "Lora,serif",
                        }
                      : { color: "#7a6a50", fontFamily: "Lora,serif" }
                  }
                >
                  {m === "focus"
                    ? "Focus"
                    : m === "short"
                      ? "Short Break"
                      : "Long Break"}
                </button>
              ))}
            </div>

            {/* Circular timer */}
            <div
              className="rounded-3xl shadow-lg p-6 flex flex-col items-center"
              style={{ background: "#fdfcf8", border: "1.5px solid #d4c5a9" }}
            >
              {!running && (
                <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-400 inline-block animate-pulse" />
                  Drag the handle to set time
                </p>
              )}

              <svg
                ref={svgRef}
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className="select-none touch-none"
                style={{
                  cursor: running
                    ? "default"
                    : dragging
                      ? "grabbing"
                      : "default",
                }}
              >
                {/* Soft background circle */}
                <circle cx={CX} cy={CY} r={R + 18} fill={col.soft} />

                {/* Track ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="14"
                  transform={`rotate(-90 ${CX} ${CY})`}
                />

                {/* Progress ring */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke={col.ring}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${CX} ${CY})`}
                  style={{
                    transition: dragging
                      ? "none"
                      : "stroke-dashoffset 1s linear, stroke 0.7s",
                  }}
                />

                {/* ── Totoro SVG character ── */}
                <g style={{ pointerEvents: "none" }}>
                  {/* Ears */}
                  <polygon points="122,108 108,64 150,96" fill="#8d9fae" />
                  <polygon points="170,96 212,64 198,108" fill="#8d9fae" />
                  {/* Ear inner blush */}
                  <polygon
                    points="125,104 118,76 145,92"
                    fill="#c9a0b4"
                    opacity="0.45"
                  />
                  <polygon
                    points="175,92 202,76 195,104"
                    fill="#c9a0b4"
                    opacity="0.45"
                  />
                  {/* Main body */}
                  <ellipse cx="160" cy="184" rx="66" ry="70" fill="#8d9fae" />
                  {/* Belly */}
                  <ellipse cx="160" cy="202" rx="36" ry="46" fill="#e8e2d5" />
                  {/* Belly chevrons */}
                  <path
                    d="M147,183 Q160,175 173,183"
                    fill="none"
                    stroke="#8d9fae"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M145,196 Q160,188 175,196"
                    fill="none"
                    stroke="#8d9fae"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M147,209 Q160,201 173,209"
                    fill="none"
                    stroke="#8d9fae"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Eyes — white sclera */}
                  <ellipse cx="140" cy="152" rx="12" ry="13" fill="white" />
                  <ellipse cx="180" cy="152" rx="12" ry="13" fill="white" />
                  {/* Pupils */}
                  <circle cx="143" cy="154" r="8" fill="#1a1a2e" />
                  <circle cx="177" cy="154" r="8" fill="#1a1a2e" />
                  {/* Eye shine */}
                  <circle cx="146" cy="150" r="3" fill="white" />
                  <circle cx="180" cy="150" r="3" fill="white" />
                  {/* Nose */}
                  <ellipse cx="160" cy="167" rx="4" ry="3" fill="#4a3042" />
                  {/* Whiskers */}
                  <line
                    x1="98"
                    y1="161"
                    x2="140"
                    y2="166"
                    stroke="#6a7a88"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="98"
                    y1="170"
                    x2="140"
                    y2="169"
                    stroke="#6a7a88"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="180"
                    y1="166"
                    x2="222"
                    y2="161"
                    stroke="#6a7a88"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  <line
                    x1="180"
                    y1="169"
                    x2="222"
                    y2="170"
                    stroke="#6a7a88"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                  {/* Small leaf on head — resting in long break */}
                  {mode === "long" && (
                    <g>
                      <ellipse
                        cx="160"
                        cy="107"
                        rx="9"
                        ry="5"
                        fill="#5a9c5a"
                        transform="rotate(-20 160 107)"
                      />
                      <line
                        x1="160"
                        y1="112"
                        x2="160"
                        y2="118"
                        stroke="#5a9c5a"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                </g>

                {/* Draggable handle */}
                <circle
                  cx={handle.x}
                  cy={handle.y}
                  r="14"
                  fill={col.ring}
                  stroke="white"
                  strokeWidth="3"
                  style={{
                    cursor: running ? "default" : "grab",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                  onMouseDown={onDragStart}
                  onTouchStart={onDragStart}
                />
                <circle
                  cx={handle.x}
                  cy={handle.y}
                  r="6"
                  fill="white"
                  style={{ pointerEvents: "none" }}
                />
              </svg>

              {/* Digital timer */}
              <div
                className="text-5xl font-black font-mono tracking-widest text-gray-900 -mt-3 mb-1"
                style={{ color: col.ring }}
              >
                {fmtTime(timeLeft)}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                {fmtMin(maxTime)}
              </p>

              {/* Session dots */}
              <div className="flex gap-2 mb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      i < cycleDone % 4 ||
                      (cycleDone % 4 === 0 && cycleDone > 0)
                        ? "bg-primary-600"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setTimeLeft(maxTime);
                    setRunning(false);
                  }}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={20} />
                </button>

                <button
                  onClick={() => setRunning((r) => !r)}
                  className={`w-20 h-20 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${col.bg}`}
                >
                  {running ? (
                    <Pause size={32} />
                  ) : (
                    <Play size={32} className="ml-1" />
                  )}
                </button>

                <button
                  onClick={() => {
                    clearInterval(intervalRef.current);
                    if (mode === "focus") {
                      plantNew();
                      const n = (cycleDone + 1) % 4;
                      setCycleDone(n);
                      switchMode(n === 0 ? "long" : "short");
                    } else switchMode("focus");
                  }}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Skip"
                >
                  <SkipForward size={20} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Leaf size={18} style={{ color: "#4e7e40" }} />,
                  label: "Plants",
                  val: garden.length,
                },
                {
                  icon: <Trophy size={18} style={{ color: "#c9a84c" }} />,
                  label: "Sessions",
                  val: stats.total,
                },
                {
                  icon: <Flame size={18} style={{ color: "#d4956a" }} />,
                  label: "Streak",
                  val: stats.streak,
                },
              ].map(({ icon, label, val }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 text-center shadow-sm"
                  style={{
                    background: "#fdfcf8",
                    border: "1.5px solid #d4c5a9",
                  }}
                >
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: "#2a1f15",
                      fontFamily: "Playfair Display, serif",
                    }}
                  >
                    {val}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "#7a6a50", fontFamily: "Lora, serif" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Garden column ─────────────────────────────────────────── */}
          <div className="xl:col-span-3">
            <div
              className="rounded-3xl shadow-lg overflow-hidden"
              style={{ border: "1.5px solid #d4c5a9" }}
            >
              <div
                className="px-8 py-6 flex items-center justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, #4e7e40 0%, #6aab55 60%, #8cbd7e 100%)",
                }}
              >
                <div>
                  <h2
                    className="text-2xl font-bold text-white"
                    style={{ fontFamily: "Playfair Display, serif" }}
                  >
                    Your Focus Garden
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: "rgba(232,240,226,0.85)",
                      fontFamily: "Lora, serif",
                    }}
                  >
                    {garden.length === 0
                      ? "Complete your first session to plant a seed!"
                      : `${garden.length} item${garden.length > 1 ? "s" : ""} · ${todayCount} today`}
                  </p>
                </div>
                <span className="text-5xl">🌿</span>
              </div>

              <div
                className="p-6 min-h-96"
                style={{
                  background:
                    "linear-gradient(180deg,#f0f8ea 0%,#dff0d8 60%,#c8e6be 100%)",
                }}
              >
                {garden.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="text-8xl mb-4 opacity-30">🌱</div>
                    <p
                      className="font-semibold text-lg"
                      style={{
                        color: "#3d6632",
                        fontFamily: "Playfair Display,serif",
                      }}
                    >
                      Your garden is empty
                    </p>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "#5a8a50", fontFamily: "Lora,serif" }}
                    >
                      Finish a focus session to grow your first plant!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {garden.map((plant) => (
                      <div
                        key={plant.id}
                        className={`flex flex-col items-center bg-white/70 backdrop-blur rounded-2xl p-3 border transition-all duration-500 cursor-default
                        ${newPlantId === plant.id ? "border-green-400 shadow-lg shadow-green-200 scale-110 animate-bounce" : "border-green-100 hover:scale-105 hover:shadow-md"}`}
                      >
                        <span className="text-3xl leading-none mb-1">
                          {plant.emoji}
                        </span>
                        <span className="text-xs font-semibold text-green-800 text-center leading-tight">
                          {plant.name}
                        </span>
                        <span className="text-xs text-gray-400 mt-0.5">
                          #{plant.session}
                        </span>
                        <span className="text-xs text-gray-400">
                          {shortDate(plant.plantedAt)}
                        </span>
                        {newPlantId === plant.id && (
                          <span className="text-xs font-bold text-green-600 mt-1">
                            New! 🎉
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {garden.length > 0 && (
                <div
                  className="px-6 py-4 flex items-center justify-between"
                  style={{
                    background: "#e8f5e2",
                    borderTop: "1.5px solid #c8e0c0",
                  }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "#3d6632", fontFamily: "Lora,serif" }}
                  >
                    🌱 Every session grows your garden!
                  </span>
                  <button
                    onClick={() =>
                      toast.confirm({
                        message:
                          "Clear your entire garden? All plants will be lost.",
                        confirmLabel: "Clear garden",
                        onConfirm: () => {
                          setGarden([]);
                          saveGarden([]);
                        },
                      })
                    }
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Clear garden
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* ── Statistics chart ─────────────────────────────────── */}
        <div
          className="mt-10 rounded-3xl shadow-lg overflow-hidden"
          style={{ border: "1.5px solid #d4c5a9" }}
        >
          <div
            className="px-8 py-5 flex items-center justify-between"
            style={{
              background:
                "linear-gradient(135deg, #2e5aa8 0%, #4a78c8 60%, #7aaae8 100%)",
            }}
          >
            <div>
              <h2
                className="text-xl font-bold text-white flex items-center gap-2"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                <BarChart2 size={20} /> Focus Statistics
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{
                  color: "rgba(200,220,255,0.85)",
                  fontFamily: "Lora, serif",
                }}
              >
                Sessions completed over time
              </p>
            </div>
            <div
              className="flex gap-1 rounded-xl overflow-hidden"
              style={{ border: "1.5px solid rgba(255,255,255,0.3)" }}
            >
              {[
                ["days", "Last 7 days"],
                ["weeks", "Last 6 weeks"],
              ].map(([view, label]) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className="px-4 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    background:
                      chartView === view
                        ? "rgba(255,255,255,0.25)"
                        : "transparent",
                    color: "#fff",
                    fontFamily: "Lora, serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6" style={{ background: "#fdfcf8" }}>
            {garden.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="text-5xl mb-3 opacity-30">📊</div>
                <p
                  className="font-semibold"
                  style={{
                    color: "#3d6632",
                    fontFamily: "Playfair Display,serif",
                  }}
                >
                  No sessions yet
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "#5a8a50", fontFamily: "Lora,serif" }}
                >
                  Complete a focus session to see your stats here!
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    chartView === "days"
                      ? getDailyData(garden, 7)
                      : getWeeklyData(garden, 6)
                  }
                  barCategoryGap="30%"
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ece7df"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 11,
                      fill: "#7a6a50",
                      fontFamily: "Lora, serif",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontSize: 11,
                      fill: "#7a6a50",
                      fontFamily: "Lora, serif",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: "rgba(78,126,64,0.07)" }}
                  />
                  <Bar dataKey="sessions" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {(chartView === "days"
                      ? getDailyData(garden, 7)
                      : getWeeklyData(garden, 6)
                    ).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.isToday ? "#4e7e40" : "#a8d08a"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {garden.length > 0 && (
              <div className="flex items-center gap-4 mt-3 justify-center">
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "#7a6a50", fontFamily: "Lora, serif" }}
                >
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: "#4e7e40" }}
                  />
                  {chartView === "days" ? "Today" : "This week"}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: "#7a6a50", fontFamily: "Lora, serif" }}
                >
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ background: "#a8d08a" }}
                  />
                  Previous {chartView === "days" ? "days" : "weeks"}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
