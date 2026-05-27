import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CalendarDays,
  Camera,
  UploadCloud,
  Search,
  X,
} from "lucide-react";
import {
  adToBs,
  bsToAd,
  bsMonthName,
  bsMonthLength,
  adMonthsForBsMonth,
} from "../../utils/nepaliDate";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import "./Journal.css";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Sunday-first for the big featured calendar
const BIG_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Monday-first for mini calendars
const MINI_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Seasonal gradients per BS month (1–12: Baisakh → Chaitra)
const BS_MONTH_GRADIENTS = [
  "linear-gradient(160deg,#b5d99c 0%,#d4edda 50%,#ecfaf0 100%)", // Baisakh  (spring)
  "linear-gradient(160deg,#5a9e6f 0%,#84c98a 50%,#c1e8c5 100%)", // Jestha   (pre-monsoon)
  "linear-gradient(160deg,#4a90b8 0%,#78b8d8 50%,#b0d8ee 100%)", // Ashadh   (monsoon)
  "linear-gradient(160deg,#2e6090 0%,#5898c0 50%,#94c4df 100%)", // Shrawan  (full monsoon)
  "linear-gradient(160deg,#6a5acd 0%,#9a88e0 50%,#ccc0f0 100%)", // Bhadra   (late monsoon)
  "linear-gradient(160deg,#e8a87c 0%,#f4c891 50%,#fff3e0 100%)", // Ashwin   (autumn)
  "linear-gradient(160deg,#d4602a 0%,#e88050 50%,#f5c090 100%)", // Kartik   (harvest)
  "linear-gradient(160deg,#a05020 0%,#c07038 50%,#e0a868 100%)", // Mangsir  (early winter)
  "linear-gradient(160deg,#1a3d6e 0%,#2c6080 50%,#6aaabe 100%)", // Poush    (winter)
  "linear-gradient(160deg,#b8d4e8 0%,#d4eaf5 50%,#eef5fb 100%)", // Magh     (mid winter)
  "linear-gradient(160deg,#f4b8cc 0%,#fce4ec 50%,#fff0f4 100%)", // Falgun   (late winter)
  "linear-gradient(160deg,#a8d5a0 0%,#c8e6c9 50%,#f0faf0 100%)", // Chaitra  (late spring)
];

// ── helpers ──────────────────────────────────────────────────────────────
function toKey(adYear, adMonth0, adDay) {
  // adMonth0 is 0-indexed (getUTCMonth)
  return `${adYear}-${String(adMonth0 + 1).padStart(2, "0")}-${String(adDay).padStart(2, "0")}`;
}
function getEntryIndex() {
  return readJSON("journal_index", []);
}
function getEntry(k) {
  return readJSON(`journal_${k}`, null);
}
function todayAdKey() {
  const t = new Date();
  return toKey(t.getFullYear(), t.getMonth(), t.getDate());
}
function loadMonthImages() {
  return readJSON("journal_month_images", {});
}
function saveMonthImages(obj) {
  writeJSON("journal_month_images", obj);
}
function formatDisplayDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function searchEntries(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getEntryIndex()
    .map((k) => ({ key: k, ...getEntry(k) }))
    .filter(
      (e) =>
        e &&
        ((e.title || "").toLowerCase().includes(q) ||
          stripHtml(e.content || "")
            .toLowerCase()
            .includes(q)),
    )
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 30);
}
function excerpt(content, query, len = 120) {
  const text = stripHtml(content || "");
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, len) + (text.length > len ? "…" : "");
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + 80);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
}

function isFutureCell(todayBs, bsYear, bsMonth, bsDay) {
  if (!todayBs) return false;
  if (bsYear > todayBs.year) return true;
  if (bsYear < todayBs.year) return false;
  if (bsMonth > todayBs.month) return true;
  if (bsMonth < todayBs.month) return false;
  return bsDay > todayBs.day;
}

// ── Big featured month (BS primary) ──────────────────────────────────────
function FeaturedMonth({
  bsYear,
  bsMonth,
  entryDates,
  onDateClick,
  image,
  onUploadImage,
}) {
  const todayBs = adToBs(new Date());
  const uploadRef = useRef();

  const daysInMonth = bsMonthLength(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const firstDow = firstAd ? firstAd.getUTCDay() : 0; // 0=Sun

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="jnl-featured">
      {/* Banner image / gradient */}
      <div
        className="jnl-banner"
        style={
          !image ? { background: BS_MONTH_GRADIENTS[bsMonth - 1] } : undefined
        }
      >
        {image && <img src={image} alt={bsMonthName(bsMonth)} />}
        <div className="jnl-banner-overlay" />
        <div className="jnl-banner-text">
          <div className="jnl-banner-month">
            {bsMonthName(bsMonth)} {bsYear}
          </div>
          <div className="jnl-banner-en-sub">
            {adMonthsForBsMonth(bsYear, bsMonth)}
          </div>
        </div>
        <button
          className="jnl-upload-btn"
          onClick={() => uploadRef.current.click()}
          title="Set cover image for this month"
        >
          <Camera size={13} /> Change Image
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) =>
              onUploadImage(`${bsYear}-${bsMonth}`, ev.target.result);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Calendar grid */}
      <div className="jnl-cal-wrap">
        <div className="jnl-bs-label">
          {bsMonthName(bsMonth)} {bsYear}
          <span className="jnl-bs-ad-hint">
            {" "}
            · {adMonthsForBsMonth(bsYear, bsMonth)}
          </span>
        </div>
        <div className="jnl-day-headers">
          {BIG_DAYS.map((d, i) => (
            <div
              key={d}
              className={`jnl-day-hdr ${i === 0 ? "sun" : ""} ${i === 6 ? "sat" : ""}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="jnl-dates-grid">
          {cells.map((bsDay, i) => {
            if (!bsDay) return <div key={`e-${i}`} />;
            const adDate = bsToAd(bsYear, bsMonth, bsDay);
            if (!adDate) return <div key={`e-${i}`} />;
            const adY = adDate.getUTCFullYear();
            const adM = adDate.getUTCMonth();
            const adD = adDate.getUTCDate();
            const key = toKey(adY, adM, adD);
            const colIdx = i % 7;
            const isSun = colIdx === 0;
            const isSat = colIdx === 6;
            const isToday =
              todayBs &&
              bsYear === todayBs.year &&
              bsMonth === todayBs.month &&
              bsDay === todayBs.day;
            const hasEntry = entryDates.has(key);
            const future = isFutureCell(todayBs, bsYear, bsMonth, bsDay);
            return (
              <button
                key={key}
                onClick={() => onDateClick(key)}
                disabled={future}
                className={[
                  "jnl-date-cell",
                  isToday ? "today" : "",
                  hasEntry && !isToday ? "has-entry" : "",
                  future ? "future" : "",
                  isSun && !isToday ? "sun-col" : "",
                  isSat && !isToday ? "sat-col" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="jnl-bs-num">{bsDay}</span>
                <span className="jnl-ad-num">{adD}</span>
                {hasEntry && <span className="dot" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mini month card (BS primary) ──────────────────────────────────────────
function MiniMonth({
  bsYear,
  bsMonth,
  entryDates,
  onDateClick,
  image,
  onUploadImage,
  isActive,
  onSelect,
}) {
  const todayBs = adToBs(new Date());
  const uploadRef = useRef();

  const daysInMonth = bsMonthLength(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const rawFirst = firstAd ? firstAd.getUTCDay() : 0; // Sun=0
  const firstDay = (rawFirst + 6) % 7; // Mon=0

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Count entries that fall in this BS month
  const count = [...entryDates].filter((key) => {
    const parts = key.split("-").map(Number);
    const bs = adToBs(new Date(parts[0], parts[1] - 1, parts[2]));
    return bs && bs.year === bsYear && bs.month === bsMonth;
  }).length;

  return (
    <div
      className={`jnl-mini-card ${isActive ? "active-month" : ""}`}
      onClick={onSelect}
    >
      {/* Image / gradient */}
      <div
        className="jnl-mini-img"
        style={
          !image ? { background: BS_MONTH_GRADIENTS[bsMonth - 1] } : undefined
        }
      >
        {image && <img src={image} alt={bsMonthName(bsMonth)} />}
        <button
          className="jnl-mini-upload"
          title="Upload image for this month"
          onClick={(e) => {
            e.stopPropagation();
            uploadRef.current.click();
          }}
        >
          <UploadCloud size={20} />
        </button>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) =>
              onUploadImage(`${bsYear}-${bsMonth}`, ev.target.result);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="jnl-mini-hdr">{bsMonthName(bsMonth)}</div>
      <div className="jnl-mini-count">
        {count > 0 ? `${count} entr${count === 1 ? "y" : "ies"}` : " "}
      </div>

      <div className="jnl-mini-day-hdrs">
        {MINI_DAYS.map((d, i) => (
          <div key={d} className={`jnl-mini-dh ${i === 6 ? "su" : ""}`}>
            {d}
          </div>
        ))}
      </div>

      <div className="jnl-mini-dates">
        {cells.map((bsDay, i) => {
          if (!bsDay) return <div key={`e-${i}`} />;
          const adDate = bsToAd(bsYear, bsMonth, bsDay);
          if (!adDate) return <div key={`e-${i}`} />;
          const key = toKey(
            adDate.getUTCFullYear(),
            adDate.getUTCMonth(),
            adDate.getUTCDate(),
          );
          const colIdx = i % 7;
          const isSu = colIdx === 6;
          const isToday =
            todayBs &&
            bsYear === todayBs.year &&
            bsMonth === todayBs.month &&
            bsDay === todayBs.day;
          const hasEntry = entryDates.has(key);
          const future = isFutureCell(todayBs, bsYear, bsMonth, bsDay);
          return (
            <button
              key={key}
              onClick={(e) => {
                e.stopPropagation();
                onDateClick(key);
              }}
              disabled={future}
              className={[
                "jnl-mini-date",
                isToday ? "today" : "",
                hasEntry && !isToday ? "hentry" : "",
                future ? "future" : "",
                isSu && !isToday ? "su-col" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {bsDay}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Journal page ─────────────────────────────────────────────────────
export default function Journal() {
  const navigate = useNavigate();
  const todayBs = adToBs(new Date()) || { year: 2083, month: 2, day: 1 };

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [bsMonth, setBsMonth] = useState(todayBs.month);

  const [entryDates, setEntryDates] = useState(new Set());
  const [recentEntries, setRecentEntries] = useState([]);
  const [monthImages, setMonthImages] = useState(loadMonthImages);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchTimer = useRef(null);

  useEffect(() => {
    const index = getEntryIndex();
    setEntryDates(new Set(index));
    const recent = index
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 6)
      .map((k) => ({ key: k, ...getEntry(k) }))
      .filter(Boolean);
    setRecentEntries(recent);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      setSearchResults(searchEntries(searchQuery));
    }, 250);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const tkAd = todayAdKey();

  const prevBsMonth = () => {
    if (bsMonth === 1) {
      setBsMonth(12);
      setBsYear((y) => y - 1);
    } else setBsMonth((m) => m - 1);
  };
  const nextBsMonth = () => {
    if (bsMonth === 12) {
      setBsMonth(1);
      setBsYear((y) => y + 1);
    } else setBsMonth((m) => m + 1);
  };

  const handleUploadImage = (key, dataUrl) => {
    const updated = { ...monthImages, [key]: dataUrl };
    setMonthImages(updated);
    saveMonthImages(updated);
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "#f4f6fb" }}
    >
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white py-12">
        <div className="container-fluid text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <BookOpen size={30} className="text-white" />
            </div>
          </div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            My Journal
          </h1>
          <p className="text-primary-100 mb-5">
            Click any date to write or read your entry
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-200 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries by keyword…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white/15 border border-white/30 text-white placeholder-primary-200 outline-none focus:bg-white/25 transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-200 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      <main className="container-fluid py-8 flex-1 max-w-5xl mx-auto w-full">
        {/* ── Search results ── */}
        {searchQuery.trim() && (
          <div className="bg-white rounded-3xl shadow-sm border border-primary-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-gray-800 text-lg flex items-center gap-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                <Search size={18} className="text-primary-600" />
                {searchResults.length > 0
                  ? `${searchResults.length} result${searchResults.length === 1 ? "" : "s"} for "${searchQuery}"`
                  : `No results for "${searchQuery}"`}
              </h3>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
            </div>

            {searchResults.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">
                Try a different keyword — entries are searched by title and
                content.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {searchResults.map(({ key, title, content, mood }) => (
                  <button
                    key={key}
                    onClick={() => navigate(`/journal/${key}`)}
                    className="text-left px-4 py-3 rounded-xl bg-primary-50 hover:bg-primary-100 border border-primary-100 transition-colors flex items-start gap-3"
                  >
                    {mood && (
                      <span className="text-xl flex-shrink-0 mt-0.5">
                        {mood}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-xs font-semibold text-primary-600">
                          {formatDisplayDate(key)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {title || "Untitled"}
                      </p>
                      {content && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {excerpt(content, searchQuery)}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Month navigation bar ── */}
        <div className="jnl-nav mb-0">
          <div className="flex items-center gap-2">
            <button
              className="jnl-arrow"
              onClick={() => setBsYear((y) => y - 1)}
              title="Previous year"
            >
              <ChevronLeft size={14} />
              <ChevronLeft size={14} style={{ marginLeft: -6 }} />
            </button>
            <button
              className="jnl-arrow"
              onClick={prevBsMonth}
              title="Previous month"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <span className="jnl-nav-label">
            <span className="jnl-nav-bs">
              {bsMonthName(bsMonth)} {bsYear}
            </span>
            <span className="jnl-nav-ad">
              {adMonthsForBsMonth(bsYear, bsMonth)}
            </span>
          </span>

          <div className="flex items-center gap-2">
            <button
              className="jnl-arrow"
              onClick={nextBsMonth}
              title="Next month"
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="jnl-arrow"
              onClick={() => setBsYear((y) => y + 1)}
              title="Next year"
            >
              <ChevronRight size={14} />
              <ChevronRight size={14} style={{ marginLeft: -6 }} />
            </button>
          </div>
        </div>

        {/* ── Featured month + sidebar ── */}
        <div className="flex gap-4 items-stretch mb-10">
          <div className="flex-1 min-w-0">
            <FeaturedMonth
              bsYear={bsYear}
              bsMonth={bsMonth}
              entryDates={entryDates}
              onDateClick={(k) => navigate(`/journal/${k}`)}
              image={monthImages[`${bsYear}-${bsMonth}`]}
              onUploadImage={handleUploadImage}
            />
          </div>

          {/* Sidebar */}
          <div className="hidden md:flex flex-col justify-between bg-white rounded-2xl shadow-sm border border-primary-100 p-5 min-w-[150px]">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                Actions
              </p>
              <button
                onClick={() => navigate(`/journal/${tkAd}`)}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <CalendarDays size={15} /> Write Today
              </button>
              <button
                className="jnl-today-btn"
                onClick={() => {
                  setBsYear(todayBs.year);
                  setBsMonth(todayBs.month);
                }}
              >
                Go to Today
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-3xl font-bold text-primary-600">
                {entryDates.size}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                total entr{entryDates.size === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile write button */}
        <div className="flex gap-3 mb-8 md:hidden">
          <button
            onClick={() => navigate(`/journal/${tkAd}`)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-xl font-semibold text-sm"
          >
            <CalendarDays size={16} /> Write Today
          </button>
          <button
            className="jnl-today-btn px-4 py-3"
            onClick={() => {
              setBsYear(todayBs.year);
              setBsMonth(todayBs.month);
            }}
          >
            Go to Today
          </button>
        </div>

        {/* ── Year overview (12 BS months) ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setBsYear((y) => y - 1)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-primary-50 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <h2
              className="text-xl font-bold text-gray-800"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {bsYear} BS
            </h2>
            <button
              onClick={() => setBsYear((y) => y + 1)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-primary-50 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
            <span className="text-xs text-gray-400 hidden sm:block">
              Click a month card to jump to it · hover to upload its cover
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => {
              const bsM = i + 1;
              return (
                <MiniMonth
                  key={bsM}
                  bsYear={bsYear}
                  bsMonth={bsM}
                  entryDates={entryDates}
                  onDateClick={(k) => navigate(`/journal/${k}`)}
                  image={monthImages[`${bsYear}-${bsM}`]}
                  onUploadImage={handleUploadImage}
                  isActive={bsM === bsMonth}
                  onSelect={() => setBsMonth(bsM)}
                />
              );
            })}
          </div>
        </div>

        {/* ── Recent entries ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-primary-100 p-8">
          <h3
            className="font-bold text-gray-800 text-xl mb-6 flex items-center gap-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <BookOpen size={22} className="text-primary-600" />
            Recent Entries
          </h3>
          {recentEntries.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-3">📓</div>
              <p className="text-gray-400">
                No entries yet — click any date to start writing!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentEntries.map(({ key, title, content, images, mood }) => (
                <button
                  key={key}
                  onClick={() => navigate(`/journal/${key}`)}
                  className="text-left p-5 rounded-2xl bg-primary-50 hover:bg-primary-100 border border-primary-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-primary-600 mb-1">
                        {formatDisplayDate(key)}
                      </p>
                      <p className="font-semibold text-gray-800 truncate">
                        {title || "Untitled"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {mood && <span className="text-xl">{mood}</span>}
                      {images?.length > 0 && (
                        <img
                          src={images[0]}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </div>
                  {content && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {stripHtml(content)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
