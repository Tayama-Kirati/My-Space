import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PenLine, Timer, Camera, BookOpen, ChevronLeft, ChevronRight, Play, X, Leaf, Film,
} from "lucide-react";
import clsx from "clsx";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth.jsx";
import { readJSON } from "../../utils/authPersistence";
import {
  adToBs, bsToAd, bsMonthName, bsMonthLength, adMonthsForBsMonth,
} from "../../utils/nepaliDate";
import { moodColor, normalizeMood } from "../../utils/moods";
import { Card } from "../../components/ui";

const BIG_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const toKey = (y, m0, d) => `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export default function Home() {
  const { user } = useAuth();
  const firstName = user?.firstName || user?.username || "friend";

  const todayBs = adToBs(new Date()) || { year: 2083, month: 2, day: 1 };
  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [bsMonth, setBsMonth] = useState(todayBs.month);
  const [sys, setSys] = useState("BS");
  const [sel, setSel] = useState(todayKey);
  const [recapOpen, setRecapOpen] = useState(false);

  // ── Load data ──
  const [data, setData] = useState({ journal: {}, mems: {}, focus: {}, books: [], bw: [], movies: [], mw: [] });
  useEffect(() => {
    const idx = readJSON("journal_index", []);
    const journal = {};
    idx.forEach((k) => { const e = readJSON(`journal_${k}`, null); if (e) journal[k] = e; });
    const memsArr = readJSON("memories", []) || [];
    const mems = {};
    memsArr.forEach((m) => { (mems[m.date] = mems[m.date] || []).push(m); });
    const garden = readJSON("pomodoro_garden", []) || [];
    const focus = {};
    garden.forEach((p) => { const k = (p.plantedAt || "").slice(0, 10); if (k) focus[k] = (focus[k] || 0) + 1; });
    setData({
      journal, mems, focus, garden,
      books: readJSON("books", []) || [], bw: readJSON("books_wishlist", []) || [],
      movies: readJSON("movies", []) || [], mw: readJSON("movies_wishlist", []) || [],
      memsArr,
    });
  }, []);

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const yearLen = ((now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0) ? 366 : 365;

  // ── Calendar cells ──
  const daysInMonth = bsMonthLength(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const firstWeekday = new Date(firstAd.year, firstAd.month - 1, firstAd.day).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ad = bsToAd(bsYear, bsMonth, d);
    const key = toKey(ad.year, ad.month - 1, ad.day);
    cells.push({ d, adDay: ad.day, key, isToday: key === todayKey });
  }

  const prev = () => { if (bsMonth === 1) { setBsMonth(12); setBsYear((y) => y - 1); } else setBsMonth((m) => m - 1); };
  const next = () => { if (bsMonth === 12) { setBsMonth(1); setBsYear((y) => y + 1); } else setBsMonth((m) => m + 1); };

  // ── Selected day panel ──
  const selBs = adToBs(new Date(...sel.split("-").map((n, i) => (i === 1 ? n - 1 : Number(n)))));
  const selEntry = data.journal[sel];
  const selMems = data.mems[sel] || [];
  const selFocus = data.focus[sel] || 0;
  const future = sel > todayKey;
  const selWd = WD[new Date(sel).getDay()];

  // ── Recap (previous BS month) ──
  const recap = useMemo(() => {
    const py = bsMonth === 1 ? bsYear - 1 : bsYear;
    const pm = bsMonth === 1 ? 12 : bsMonth - 1;
    const aStart = bsToAd(py, pm, 1);
    const aEnd = bsToAd(py, pm, bsMonthLength(py, pm));
    const startKey = toKey(aStart.year, aStart.month - 1, aStart.day);
    const endKey = toKey(aEnd.year, aEnd.month - 1, aEnd.day);
    const inRange = (k) => k >= startKey && k <= endKey;
    const photos = (data.memsArr || []).filter((m) => inRange(m.date));
    const jkeys = Object.keys(data.journal).filter(inRange);
    const places = new Set(photos.filter((p) => p.location).map((p) => p.location)).size;
    const moodTally = {};
    jkeys.forEach((k) => { const nm = normalizeMood(data.journal[k].mood); if (nm) moodTally[nm] = (moodTally[nm] || 0) + 1; });
    const topMood = Object.entries(moodTally).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { label: `${bsMonthName(pm)} ${py}`, photos, places, journalCount: jkeys.length, topMood };
  }, [bsYear, bsMonth, data]);

  // ── On this day (one BS year ago) ──
  const onThisDay = useMemo(() => {
    const ad = bsToAd(todayBs.year - 1, todayBs.month, todayBs.day);
    if (!ad) return null;
    const key = toKey(ad.year, ad.month - 1, ad.day);
    const e = data.journal[key];
    const m = (data.mems[key] || [])[0];
    if (!e && !m) return null;
    return { key, entry: e, mem: m };
  }, [data, todayBs]);

  const nextBook = data.bw[0] || data.books[0];
  const nextFilm = data.mw[0] || data.movies[0];

  const QUICK = [
    { to: `/journal/${todayKey}`, label: "Write today", icon: PenLine, main: true },
    { to: "/pomodoro", label: "Focus 25 min", icon: Timer },
    { to: "/memories", label: "Add a memory", icon: Camera },
    { to: "/books", label: "Log a book", icon: BookOpen },
  ];

  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-hero mt-7 min-h-[300px] flex flex-col justify-between p-8"
        style={{ background: "linear-gradient(180deg,#BFD9E8 0%,#DCEAE6 55%,#EEF0E2 100%)" }}>
        <div aria-hidden className="absolute rounded-full" style={{ top: 34, left: "58%", width: 70, height: 70, background: "#F6DFA3", boxShadow: "0 0 0 18px rgba(246,223,163,.28)" }} />
        <svg viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden className="absolute left-0 right-0 bottom-0 w-full" style={{ height: "62%" }}>
          <path d="M0 120 C 160 50 300 80 430 105 C 590 135 720 60 900 80 C 1020 92 1110 70 1200 88 L1200 220 L0 220 Z" fill="#C6D8BC" />
          <path d="M0 160 C 180 115 330 150 480 152 C 660 155 800 112 960 130 C 1070 142 1140 128 1200 134 L1200 220 L0 220 Z" fill="#97B98B" />
          <path d="M0 196 C 200 168 380 188 560 190 C 760 192 900 170 1060 178 C 1120 181 1170 176 1200 178 L1200 220 L0 220 Z" fill="#6A9461" />
        </svg>
        <div className="relative z-[2] flex justify-between gap-6 flex-wrap">
          <div>
            <p className="eyebrow" style={{ color: "#3F5A4A" }}>
              {WD[now.getDay()]} · {bsMonthName(todayBs.month)} {todayBs.day}, {todayBs.year} · {now.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="font-serif font-medium text-ink mt-2.5 leading-[1.1]" style={{ fontSize: 48 }}>
              {greeting},<br />{firstName}.
            </h1>
          </div>
          <div className="bg-surface/85 rounded-card p-3.5 flex gap-3.5 items-center self-start">
            <svg width="54" height="54" viewBox="0 0 54 54" role="img" aria-label={`Day ${dayOfYear}`}>
              <circle cx="27" cy="27" r="22" fill="none" stroke="var(--c-line)" strokeWidth="6" />
              <circle cx="27" cy="27" r="22" fill="none" stroke="var(--c-moss)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22} strokeDashoffset={2 * Math.PI * 22 * (1 - dayOfYear / yearLen)} transform="rotate(-90 27 27)" />
            </svg>
            <div>
              <p className="font-semibold">Day {dayOfYear} of {now.getFullYear()}</p>
              <p className="text-[13px] text-ink-3">{yearLen - dayOfYear} days left this year</p>
            </div>
          </div>
        </div>
        <nav className="relative z-[2] flex gap-2.5 flex-wrap" aria-label="Quick actions">
          {QUICK.map(({ to, label, icon: Icon, main }) => (
            <Link key={to} to={to}
              className={clsx("inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full font-semibold text-sm shadow-card",
                main ? "bg-moss text-white hover:bg-moss-d" : "bg-surface/90 text-ink hover:bg-surface")}>
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </section>

      {/* Calendar + Day panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        <Card className="lg:col-span-8 p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-1">
              <button onClick={prev} aria-label="Previous month" className="w-11 h-11 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><ChevronLeft size={18} /></button>
              <div>
                <h2 className="font-serif font-medium text-[24px]">{sys === "BS" ? `${bsMonthName(bsMonth)} ${bsYear}` : adMonthsForBsMonth(bsYear, bsMonth)}</h2>
                <p className="text-[13px] text-ink-3">{adMonthsForBsMonth(bsYear, bsMonth)}</p>
              </div>
              <button onClick={next} aria-label="Next month" className="w-11 h-11 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><ChevronRight size={18} /></button>
            </div>
            <div className="inline-flex gap-1 p-1 rounded-[12px] bg-sunk">
              {["BS", "AD"].map((s) => (
                <button key={s} onClick={() => setSys(s)}
                  className={clsx("min-h-[36px] px-3.5 rounded-[9px] text-[13px] font-semibold",
                    sys === s ? "bg-surface text-ink shadow-[0_1px_2px_rgba(35,28,20,.12)]" : "text-ink-2")}>
                  {s === "BS" ? "Bikram Sambat" : "Gregorian"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {BIG_DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-ink-3 pb-2">{d}</div>)}
            {cells.map((c, i) => c == null ? <div key={`b${i}`} /> : (
              <button key={c.key} onClick={() => setSel(c.key)}
                className={clsx("relative min-h-[72px] rounded-[12px] border p-2 flex flex-col justify-between text-left transition-colors",
                  sel === c.key ? "bg-ink border-ink text-white" : c.key > todayKey ? "bg-transparent border-dashed border-line text-ink-3" : "bg-white border-line text-ink hover:border-ink/40",
                  c.isToday && sel !== c.key && "!border-moss border-2")}>
                <span className="flex justify-between items-baseline">
                  <b className="text-base font-semibold">{sys === "BS" ? c.d : c.adDay}</b>
                  <span className={clsx("text-[11px]", sel === c.key ? "text-white/70" : "text-ink-3")}>{sys === "BS" ? c.adDay : c.d}</span>
                </span>
                <span className="flex gap-1 items-center">
                  {data.journal[c.key] && <span className="w-2 h-2 rounded-full" style={{ background: moodColor(data.journal[c.key].mood) }} />}
                  {data.mems[c.key] && <span className="w-2 h-2 rounded-[2px]" style={{ background: "var(--c-clay)" }} />}
                  {data.focus[c.key] && <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: sel === c.key ? "#BFD6EC" : "var(--c-sky)" }} />}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-4 flex-wrap text-xs text-ink-3 mt-3.5">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky" />Journal (colour = mood)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px] bg-clay" />Memory</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border-2 border-sky" />Focus</span>
          </div>
        </Card>

        <Card className="lg:col-span-4 p-6 flex flex-col" aria-live="polite">
          <p className="eyebrow">{future ? "Coming up" : sel === todayKey ? "Today" : "Looking back"}</p>
          <h2 className="font-serif font-medium text-[26px] mt-1.5">{selWd}, {selBs ? `${bsMonthName(selBs.month)} ${selBs.day}` : ""}</h2>
          <p className="text-[13px] text-ink-3 mb-3.5">{new Date(sel).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</p>

          <PanelRow icon={PenLine} tone="moss" title="Journal">
            {selEntry ? (
              <>
                {normalizeMood(selEntry.mood) && (
                  <p className="text-[13px] flex items-center gap-1.5 mt-0.5"><span className="w-2 h-2 rounded-full" style={{ background: moodColor(selEntry.mood) }} />Feeling {normalizeMood(selEntry.mood)}</p>
                )}
                <p className="font-serif italic text-ink-2 mt-1.5 line-clamp-2">{stripHtml(selEntry.content).slice(0, 110) || selEntry.title || "…"}</p>
              </>
            ) : <p className="text-[13px] mt-0.5 text-ink-3">{future ? "This day hasn't happened yet." : sel === todayKey ? "Nothing written yet." : "No entry for this day."}</p>}
          </PanelRow>

          <PanelRow icon={Timer} tone="sky" title="Focus">
            <p className="text-[13px] mt-0.5 text-ink-3">{selFocus ? `${selFocus} session${selFocus > 1 ? "s" : ""} · ${selFocus * 25} min` : future ? "—" : "No sessions"}</p>
          </PanelRow>

          <PanelRow icon={Camera} tone="clay" title="Memories">
            <p className="text-[13px] mt-0.5 text-ink-3">{selMems.length ? `${selMems.length} photo${selMems.length > 1 ? "s" : ""} saved` : future ? "—" : "No memories saved"}</p>
            {selMems.length > 0 && (
              <div className="flex gap-2 mt-2.5">
                {selMems.slice(0, 3).map((m) => <img key={m.id} src={m.imageData} alt="" className="w-16 h-16 rounded-[10px] object-cover" />)}
              </div>
            )}
          </PanelRow>

          <Link to={`/journal/${sel}`} className="mt-auto inline-flex items-center justify-center min-h-[44px] rounded-ctl bg-moss text-white font-semibold text-sm hover:bg-moss-d">
            {future ? "Plan this day" : selEntry ? "Open entry" : "Write for this day"}
          </Link>
        </Card>
      </div>

      {/* Recap band */}
      <section className="bg-recap-bg text-recap-fg rounded-hero p-8 mt-5 overflow-hidden">
        <div className="flex gap-10 flex-wrap items-center">
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <p className="eyebrow" style={{ color: "var(--c-recap-mute)" }}>Memory recap · {recap.label}</p>
            <h2 className="font-serif font-medium leading-[1.15] mt-2.5" style={{ fontSize: 40, color: "#fff" }}>
              Your month in<br /><em>{recap.photos.length} moments.</em>
            </h2>
            <div className="flex gap-8 mt-6 flex-wrap">
              {[[recap.photos.length, "photos"], [recap.places, "places"], [recap.topMood, "most-felt mood"], [recap.journalCount, "journal entries"]].map(([v, l]) => (
                <div key={l}><b className="block font-serif font-medium text-[30px] text-white leading-tight">{v}</b><span className="text-xs text-recap-mute">{l}</span></div>
              ))}
            </div>
            <div className="flex gap-2.5 mt-7 flex-wrap">
              <button onClick={() => recap.photos.some((p) => p.imageData) && setRecapOpen(true)}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-ctl font-semibold text-sm bg-recap-fg text-recap-bg hover:opacity-90">
                <Play size={15} /> Play recap
              </button>
              <Link to="/memories" className="inline-flex items-center min-h-[44px] px-4 rounded-ctl font-semibold text-sm text-recap-fg border border-recap-fg/35 hover:bg-recap-fg/10">
                Browse all memories
              </Link>
            </div>
          </div>
          <div className="relative h-[300px]" style={{ flex: "1 1 460px", minWidth: 300 }} aria-label="Recap photos">
            {[{ l: "4%", t: 40, r: -7 }, { l: "32%", t: 6, r: 3, z: 2 }, { l: "60%", t: 52, r: 9 }].map((pos, i) => {
              const photo = recap.photos.filter((p) => p.imageData)[i];
              return (
                <div key={i} className="absolute w-[190px] bg-[#FBF8F1] p-2.5 pb-8 rounded shadow-pola"
                  style={{ left: pos.l, top: pos.t, transform: `rotate(${pos.r}deg)`, zIndex: pos.z || 1 }}>
                  {photo ? <img src={photo.imageData} alt="" className="h-[170px] w-full object-cover rounded-sm" />
                    : <div className="h-[170px] ph-stripes rounded-sm" />}
                  <p className="absolute bottom-2 left-3 right-3 font-serif italic text-[13px] text-[#4A3F33] truncate">{photo?.caption || "A moment"}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        <Card className="p-6">
          <p className="eyebrow">On this day</p>
          <h2 className="font-semibold text-base mt-1.5">{bsMonthName(todayBs.month)} {todayBs.day}, one year ago</h2>
          {onThisDay ? (
            <>
              {onThisDay.mem && <img src={onThisDay.mem.imageData} alt="" className="h-36 w-full object-cover rounded-ctl mt-3.5" />}
              <p className="font-serif italic text-ink-2 mt-3">{onThisDay.entry ? stripHtml(onThisDay.entry.content).slice(0, 120) || onThisDay.entry.title : onThisDay.mem?.caption}</p>
            </>
          ) : <p className="text-[13px] text-ink-3 mt-3">Nothing saved a year ago yet.</p>}
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-baseline">
            <h2 className="font-semibold text-base">Focus garden</h2>
            <Link to="/pomodoro" className="text-[13px] text-moss">Start →</Link>
          </div>
          <p className="text-[13px] text-ink-3 mt-1">{data.focus[todayKey] || 0} of 4 sessions today</p>
          <div className="grid grid-cols-5 gap-2 mt-4">
            {Array.from({ length: 10 }).map((_, i) => {
              const plant = (data.garden || [])[i];
              return (
                <div key={i} className="aspect-square rounded-[10px] bg-sunk flex items-center justify-center text-ink-3/60">
                  {plant ? <span className="text-base">{plant.emoji}</span> : <Leaf size={14} />}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-base">Now reading &amp; watching</h2>
          {nextBook ? (
            <Link to="/books" className="flex gap-3.5 mt-4 text-ink">
              <div className="w-12 h-[70px] rounded-sm flex-shrink-0 overflow-hidden" style={{ background: "#2F4A6B" }}>
                {nextBook.image && <img src={nextBook.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div><p className="font-semibold text-sm">{nextBook.title}</p><p className="text-[13px] text-ink-3">{nextBook.author || "On your shelf"}</p></div>
            </Link>
          ) : <p className="text-[13px] text-ink-3 mt-4">No books yet — <Link to="/books" className="text-moss">log one</Link>.</p>}
          {nextFilm ? (
            <Link to="/movies" className="flex gap-3.5 mt-3.5 text-ink">
              <div className="w-12 h-[70px] rounded-sm flex-shrink-0 overflow-hidden flex items-center justify-center" style={{ background: "#7A3B4C" }}>
                {nextFilm.image ? <img src={nextFilm.image} alt="" className="w-full h-full object-cover" /> : <Film size={18} className="text-white/70" />}
              </div>
              <div><p className="font-semibold text-sm">{nextFilm.title}</p><p className="text-[13px] text-ink-3">Next on your watchlist</p></div>
            </Link>
          ) : null}
        </Card>
      </div>

      {recapOpen && <RecapViewer photos={recap.photos.filter((p) => p.imageData)} onClose={() => setRecapOpen(false)} />}
    </AppLayout>
  );
}

function PanelRow({ icon: Icon, tone, title, children }) {
  const tones = { moss: "bg-moss-t text-moss-d", sky: "bg-sky-t text-sky-ink", clay: "bg-clay-t text-clay-ink" };
  return (
    <div className="flex gap-3 items-start py-3.5 border-t border-line">
      <span className={clsx("w-9 h-9 rounded-ctl flex items-center justify-center flex-shrink-0", tones[tone])}><Icon size={17} /></span>
      <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p>{children}</div>
    </div>
  );
}

function RecapViewer({ photos, onClose }) {
  const [i, setI] = useState(0);
  const go = useCallback((n) => setI(((n % photos.length) + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    const t = setTimeout(() => go(i + 1), 4000);
    return () => clearTimeout(t);
  }, [i, go]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, go, onClose]);

  if (!photos.length) return null;
  const p = photos[i];
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(10,8,5,.96)" }}>
      <div className="flex gap-1.5 p-4">
        {photos.map((_, n) => <span key={n} className="flex-1 h-[3px] rounded-full" style={{ background: n <= i ? "#fff" : "rgba(255,255,255,.25)" }} />)}
      </div>
      <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full text-white" style={{ background: "rgba(255,255,255,.15)" }}><X size={20} /></button>
      <div className="flex-1 relative flex items-center justify-center">
        <button onClick={() => go(i - 1)} aria-label="Previous" className="absolute left-0 top-0 bottom-0 w-1/3" />
        <img src={p.imageData} alt="" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg" />
        <button onClick={() => go(i + 1)} aria-label="Next" className="absolute right-0 top-0 bottom-0 w-1/3" />
      </div>
      {p.caption && <p className="text-center text-white font-serif italic text-lg pb-12 px-6">{p.caption}</p>}
    </div>
  );
}
