import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UploadCloud,
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

const MINI_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const BS_MONTH_GRADIENTS = [
  "linear-gradient(160deg,#b5d99c 0%,#d4edda 50%,#ecfaf0 100%)",
  "linear-gradient(160deg,#5a9e6f 0%,#84c98a 50%,#c1e8c5 100%)",
  "linear-gradient(160deg,#4a90b8 0%,#78b8d8 50%,#b0d8ee 100%)",
  "linear-gradient(160deg,#2e6090 0%,#5898c0 50%,#94c4df 100%)",
  "linear-gradient(160deg,#6a5acd 0%,#9a88e0 50%,#ccc0f0 100%)",
  "linear-gradient(160deg,#e8a87c 0%,#f4c891 50%,#fff3e0 100%)",
  "linear-gradient(160deg,#d4602a 0%,#e88050 50%,#f5c090 100%)",
  "linear-gradient(160deg,#a05020 0%,#c07038 50%,#e0a868 100%)",
  "linear-gradient(160deg,#1a3d6e 0%,#2c6080 50%,#6aaabe 100%)",
  "linear-gradient(160deg,#b8d4e8 0%,#d4eaf5 50%,#eef5fb 100%)",
  "linear-gradient(160deg,#f4b8cc 0%,#fce4ec 50%,#fff0f4 100%)",
  "linear-gradient(160deg,#a8d5a0 0%,#c8e6c9 50%,#f0faf0 100%)",
];

function toKey(adYear, adMonth0, adDay) {
  return `${adYear}-${String(adMonth0 + 1).padStart(2, "0")}-${String(adDay).padStart(2, "0")}`;
}
function getEntryIndex() {
  return readJSON("journal_index", []);
}
function getEntry(k) {
  return readJSON(`journal_${k}`, null);
}
function loadMonthImages() {
  return readJSON("journal_month_images", {});
}
function saveMonthImages(obj) {
  writeJSON("journal_month_images", obj);
}
function isFutureCell(todayBs, bsYear, bsMonth, bsDay) {
  if (!todayBs) return false;
  if (bsYear > todayBs.year) return true;
  if (bsYear < todayBs.year) return false;
  if (bsMonth > todayBs.month) return true;
  if (bsMonth < todayBs.month) return false;
  return bsDay > todayBs.day;
}

function MiniMonth({ bsYear, bsMonth, entryDates, onDateClick, image, onUploadImage, isActive, onSelect }) {
  const todayBs = adToBs(new Date());
  const uploadRef = useRef();

  const daysInMonth = bsMonthLength(bsYear, bsMonth);
  const firstAd = bsToAd(bsYear, bsMonth, 1);
  const rawFirst = firstAd ? firstAd.getUTCDay() : 0;
  const firstDay = (rawFirst + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

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
      <div
        className="jnl-mini-img"
        style={!image ? { background: BS_MONTH_GRADIENTS[bsMonth - 1] } : undefined}
      >
        {image && <img src={image} alt={bsMonthName(bsMonth)} />}
        <button
          className="jnl-mini-upload"
          title="Upload image for this month"
          onClick={(e) => { e.stopPropagation(); uploadRef.current.click(); }}
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
            reader.onload = (ev) => onUploadImage(`${bsYear}-${bsMonth}`, ev.target.result);
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="jnl-mini-hdr">{bsMonthName(bsMonth)}</div>
      <div className="jnl-mini-count">
        {count > 0 ? `${count} entr${count === 1 ? "y" : "ies"}` : " "}
      </div>

      <div className="jnl-mini-day-hdrs">
        {MINI_DAYS.map((d, i) => (
          <div key={d} className={`jnl-mini-dh ${i === 6 ? "su" : ""}`}>{d}</div>
        ))}
      </div>

      <div className="jnl-mini-dates">
        {cells.map((bsDay, i) => {
          if (!bsDay) return <div key={`e-${i}`} />;
          const adDate = bsToAd(bsYear, bsMonth, bsDay);
          if (!adDate) return <div key={`e-${i}`} />;
          const key = toKey(adDate.getUTCFullYear(), adDate.getUTCMonth(), adDate.getUTCDate());
          const colIdx = i % 7;
          const isSu = colIdx === 6;
          const isToday = todayBs && bsYear === todayBs.year && bsMonth === todayBs.month && bsDay === todayBs.day;
          const hasEntry = entryDates.has(key);
          const future = isFutureCell(todayBs, bsYear, bsMonth, bsDay);
          return (
            <button
              key={key}
              onClick={(e) => { e.stopPropagation(); onDateClick(key); }}
              disabled={future}
              className={[
                "jnl-mini-date",
                isToday ? "today" : "",
                hasEntry && !isToday ? "hentry" : "",
                future ? "future" : "",
                isSu && !isToday ? "su-col" : "",
              ].filter(Boolean).join(" ")}
            >
              {bsDay}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function JournalMemories() {
  const navigate = useNavigate();
  const todayBs = adToBs(new Date()) || { year: 2083, month: 2, day: 1 };

  const [bsYear, setBsYear] = useState(todayBs.year);
  const [entryDates, setEntryDates] = useState(new Set());
  const [monthImages, setMonthImages] = useState(loadMonthImages);

  useEffect(() => {
    const index = getEntryIndex();
    setEntryDates(new Set(index));
  }, []);

  const handleUploadImage = (key, dataUrl) => {
    const updated = { ...monthImages, [key]: dataUrl };
    setMonthImages(updated);
    saveMonthImages(updated);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f4f6fb" }}>
      <Navbar />

      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white py-12">
        <div className="container-fluid text-center">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Sparkles size={30} className="text-white" />
            </div>
          </div>
          <h1
            className="text-4xl font-bold mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Memories
          </h1>
          <p className="text-primary-100">
            All your journal months — click a date to read or write
          </p>
        </div>
      </section>

      <main className="container-fluid py-8 flex-1 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/journal")}
            className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
          >
            <ChevronLeft size={16} /> Back to Journal
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setBsYear((y) => y - 1)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-primary-50 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <span className="text-lg font-bold text-gray-800 px-1">
              {bsYear} BS
            </span>
            <button
              onClick={() => setBsYear((y) => y + 1)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-primary-50 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
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
                isActive={bsM === todayBs.month && bsYear === todayBs.year}
                onSelect={() => navigate(`/journal`)}
              />
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
