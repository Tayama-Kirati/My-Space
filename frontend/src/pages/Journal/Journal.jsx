import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, PenLine, Lock, ImagePlus, X } from "lucide-react";
import clsx from "clsx";
import AppLayout from "../../components/layout/AppLayout";
import {
  adToBs, bsToAd, bsMonthName, bsMonthLength, adMonthsForBsMonth,
} from "../../utils/nepaliDate";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import { MOODS, normalizeMood, moodColor } from "../../utils/moods";
import { PageHeader, Card, Button, Segmented } from "../../components/ui";

const BIG_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── data helpers (unchanged keys) ───────────────────────────────────────────
const toKey = (y, m0, d) => `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const getEntryIndex = () => readJSON("journal_index", []);
const getEntry = (k) => readJSON(`journal_${k}`, null);
const loadMonthImages = () => readJSON("journal_month_images", {});
const saveMonthImages = (o) => writeJSON("journal_month_images", o);
const getJournalPw = () => localStorage.getItem("journal_pw");
const checkJournalPw = (p) => { const s = getJournalPw(); return !!s && btoa(p) === s; };
const isSessionOpen = () => sessionStorage.getItem("jnl_open") === "1";
const openSession = () => sessionStorage.setItem("jnl_open", "1");
const todayAdKey = () => { const t = new Date(); return toKey(t.getFullYear(), t.getMonth(), t.getDate()); };
const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function searchEntries(query) {
  const q = query.toLowerCase();
  return getEntryIndex()
    .map((k) => ({ key: k, ...getEntry(k) }))
    .filter((e) => e && ((e.title || "").toLowerCase().includes(q) || stripHtml(e.content).toLowerCase().includes(q)))
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 30);
}

function isFuture(todayBs, y, m, d) {
  if (!todayBs) return false;
  if (y !== todayBs.year) return y > todayBs.year;
  if (m !== todayBs.month) return m > todayBs.month;
  return d > todayBs.day;
}

function computeStreak(dateSet) {
  let streak = 0;
  const d = new Date();
  for (;;) {
    const k = toKey(d.getFullYear(), d.getMonth(), d.getDate());
    if (dateSet.has(k)) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

function entryBsLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const bs = adToBs(new Date(y, m - 1, d));
  return bs ? { day: bs.day, month: bsMonthName(bs.month) } : { day: d, month: "" };
}

export default function Journal() {
  const navigate = useNavigate();
  const todayBs = adToBs(new Date()) || { year: 2083, month: 2, day: 1 };

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [bsMonth, setBsMonth] = useState(todayBs.month);
  const [index, setIndex] = useState([]);
  const [entryMeta, setEntryMeta] = useState({}); // key -> {mood, private, title, content}
  const [monthImages, setMonthImages] = useState(loadMonthImages);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [moodFilter, setMoodFilter] = useState("all");

  const [gateTarget, setGateTarget] = useState(null);
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState("");

  const coverRef = useRef();
  const searchTimer = useRef(null);

  useEffect(() => {
    const idx = getEntryIndex();
    setIndex(idx);
    const meta = {};
    idx.forEach((k) => {
      const e = getEntry(k);
      if (e) meta[k] = { mood: e.mood || "", private: !!e.private, title: e.title || "", content: e.content || "" };
    });
    setEntryMeta(meta);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(() => setSearchResults(searchEntries(searchQuery)), 250);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const dateSet = useMemo(() => new Set(index), [index]);
  const streak = useMemo(() => computeStreak(dateSet), [dateSet]);
  const tkAd = todayAdKey();

  const thisMonthCount = useMemo(
    () => index.filter((k) => {
      const [y, m, d] = k.split("-").map(Number);
      const bs = adToBs(new Date(y, m - 1, d));
      return bs && bs.year === bsYear && bs.month === bsMonth;
    }).length,
    [index, bsYear, bsMonth]
  );

  const prevMonth = () => { if (bsMonth === 1) { setBsMonth(12); setBsYear((y) => y - 1); } else setBsMonth((m) => m - 1); };
  const nextMonth = () => { if (bsMonth === 12) { setBsMonth(1); setBsYear((y) => y + 1); } else setBsMonth((m) => m + 1); };

  const openDate = (k) => {
    if (entryMeta[k]?.private && getJournalPw() && !isSessionOpen()) {
      setGateTarget(k); setGateInput(""); setGateError("");
    } else navigate(`/journal/${k}`);
  };

  const submitGate = () => {
    if (checkJournalPw(gateInput)) {
      openSession();
      const t = gateTarget;
      setGateTarget(null);
      navigate(`/journal/${t}`);
    } else setGateError("Incorrect password.");
  };

  const uploadCover = (dataUrl) => {
    const updated = { ...monthImages, [`${bsYear}-${bsMonth}`]: dataUrl };
    setMonthImages(updated);
    saveMonthImages(updated);
  };

  // Build calendar cells
  const daysInMonth = bsMonthLength(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const firstWeekday = new Date(firstAd.year, firstAd.month - 1, firstAd.day).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ad = bsToAd(bsYear, bsMonth, d);
    const key = toKey(ad.year, ad.month - 1, ad.day);
    cells.push({
      d, adDay: ad.day, key,
      has: dateSet.has(key),
      mood: entryMeta[key]?.mood,
      isToday: key === tkAd,
      future: isFuture(todayBs, bsYear, bsMonth, d),
    });
  }

  const cover = monthImages[`${bsYear}-${bsMonth}`];

  // Recent / filtered list
  const recent = useMemo(
    () => index.slice().sort((a, b) => b.localeCompare(a)).slice(0, 12).map((k) => ({ key: k, ...entryMeta[k] })),
    [index, entryMeta]
  );
  const showingSearch = searchQuery.trim().length > 0;
  const list = (showingSearch ? searchResults : recent).filter(
    (e) => moodFilter === "all" || normalizeMood(e.mood) === moodFilter
  );

  const moodOptions = [{ value: "all", label: "All moods" }, ...MOODS.map((m) => ({ value: m.name, label: m.name }))];

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Journal"
        title={`${bsMonthName(bsMonth)} ${bsYear}`}
        subtitle={`${adMonthsForBsMonth(bsYear, bsMonth)} · tap a day to read or write.`}
        stats={[
          { value: streak, label: "day streak" },
          { value: thisMonthCount, label: "this month" },
          { value: index.length, label: "all entries" },
        ]}
        action={<Button icon={PenLine} onClick={() => navigate(`/journal/${tkAd}`)}>Write today</Button>}
      />

      <div className="flex gap-6 flex-wrap items-start pb-4">
        {/* Calendar */}
        <Card className="p-5" style={{ flex: "1 1 380px" }}>
          {cover && (
            <div className="relative rounded-ctl overflow-hidden mb-3 h-24">
              <img src={cover} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} aria-label="Previous month" className="w-11 h-11 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><ChevronLeft size={18} /></button>
            <div className="text-center">
              <p className="font-semibold">{bsMonthName(bsMonth)} {bsYear}</p>
              <p className="text-[13px] text-ink-3">{adMonthsForBsMonth(bsYear, bsMonth)}</p>
            </div>
            <button onClick={nextMonth} aria-label="Next month" className="w-11 h-11 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {BIG_DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-ink-3 py-1.5">{d}</div>)}
            {cells.map((c, i) =>
              c == null ? <div key={`b${i}`} /> : (
                <button
                  key={c.key}
                  disabled={c.future}
                  onClick={() => openDate(c.key)}
                  aria-label={`${bsMonthName(bsMonth)} ${c.d}${c.isToday ? ", today" : ""}`}
                  className={clsx(
                    "relative aspect-square min-h-[44px] rounded-[10px] border flex flex-col items-center justify-center gap-px transition-colors",
                    c.future ? "border-transparent text-ink-3/60 cursor-default"
                      : "border-transparent text-ink hover:bg-sunk",
                    c.isToday && "!border-moss bg-moss-t"
                  )}
                >
                  <b className="text-[15px] font-semibold">{c.d}</b>
                  <small className="text-[10px] text-ink-3">{c.adDay}</small>
                  {c.has && !c.future && (
                    <span className="absolute bottom-1.5 w-[5px] h-[5px] rounded-full"
                      style={{ background: c.mood ? moodColor(c.mood) : "var(--c-moss)" }} />
                  )}
                </button>
              )
            )}
          </div>

          <div className="flex items-center justify-between gap-3 mt-3.5 flex-wrap text-xs text-ink-3">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-moss" />Has entry · small no. = AD</span>
            <button onClick={() => coverRef.current.click()} className="flex items-center gap-1.5 hover:text-ink">
              <ImagePlus size={13} /> {cover ? "Change cover" : "Add cover"}
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files[0]; if (!f) return;
                const r = new FileReader(); r.onload = (ev) => uploadCover(ev.target.result); r.readAsDataURL(f); e.target.value = "";
              }} />
          </div>
        </Card>

        {/* Recent / search */}
        <section style={{ flex: "999 1 520px", minWidth: 0 }}>
          <div className="flex gap-3 items-center flex-wrap mb-2">
            <h2 className="font-serif font-medium text-[26px] text-ink mr-auto">
              {showingSearch ? "Search results" : "Recent entries"}
            </h2>
            <div className="relative flex-1 max-w-[260px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search entries" placeholder="Search entries"
                className="w-full h-11 pl-9 pr-3 bg-white border border-line rounded-ctl outline-none text-ink focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
            </div>
          </div>

          <Segmented className="my-2" ariaLabel="Filter by mood" options={moodOptions} value={moodFilter} onChange={setMoodFilter} />

          {list.length === 0 ? (
            <p className="text-ink-3 py-10 text-center">
              {showingSearch ? "No entries match your search." : "No entries yet — tap a day to write a few lines."}
            </p>
          ) : (
            <div className="mt-2">
              {list.map((e) => {
                const bs = entryBsLabel(e.key);
                const moodName = normalizeMood(e.mood);
                return (
                  <button key={e.key} onClick={() => openDate(e.key)}
                    className="w-full text-left flex gap-4 py-[18px] border-b border-line text-ink hover:bg-sunk/40 transition-colors">
                    <div className="flex-none w-14 text-center">
                      <b className="block font-serif text-[26px] font-medium leading-none">{bs.day}</b>
                      <span className="text-[13px] text-ink-3">{bs.month}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2 items-center mb-1 flex-wrap">
                        <span className="font-semibold text-base">{e.title || "Untitled entry"}</span>
                        {e.private && <Lock size={13} className="text-ink-3" />}
                        {moodName && (
                          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-xs font-semibold bg-sunk text-ink-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: moodColor(moodName) }} />
                            {moodName}
                          </span>
                        )}
                      </div>
                      <p className="text-ink-2 text-sm line-clamp-2">
                        {stripHtml(e.content).slice(0, 160) || "…"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Password gate */}
      {gateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,34,18,.55)" }}
          onClick={(e) => e.target === e.currentTarget && setGateTarget(null)}>
          <Card className="p-7 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-[22px] text-ink flex items-center gap-2"><Lock size={18} /> Private entry</h2>
              <button onClick={() => setGateTarget(null)} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full text-ink-2 hover:bg-sunk"><X size={18} /></button>
            </div>
            <p className="text-ink-2 text-sm mb-4">Enter your journal password to open this entry.</p>
            <input type="password" autoFocus value={gateInput} onChange={(e) => setGateInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitGate()}
              className="w-full h-11 px-3.5 bg-white border border-line rounded-ctl outline-none focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
            {gateError && <p className="text-clay-ink text-[13px] mt-2">{gateError}</p>}
            <Button className="w-full mt-4" onClick={submitGate}>Unlock</Button>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
