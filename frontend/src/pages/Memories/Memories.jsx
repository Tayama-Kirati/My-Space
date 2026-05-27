import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  Upload,
  X,
  Plus,
  MapPin,
  ChevronDown,
  Trash2,
  ZoomIn,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import { useToast } from "../../components/Toast";
import { readJSON, writeJSON } from "../../utils/authPersistence";

const G = {
  cream: "#f5f0e8",
  card: "#fdfcf8",
  border: "#d4c5a9",
  green: "#4e7e40",
  greenDk: "#3d6632",
  gold: "#c9a84c",
  text: "#2a1f15",
  textMd: "#5a4a35",
  textSm: "#7a6a50",
  lightBg: "#e8f5e2",
};

function loadMemories() {
  return readJSON("memories", []);
}
function saveMemories(m) {
  writeJSON("memories", m);
}
function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
function fmtShort(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
function monthLabel(iso) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
function monthKey(iso) {
  return iso.slice(0, 7);
}

const MOODS = ["😊", "😐", "😢", "🤩", "😴", "😤", "🥰", "😰"];

// ── Add Memory Modal ─────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [imageData, setImageData] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const cameraRef = useRef();

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageData) return;
    onAdd({
      id: Date.now(),
      imageData,
      date,
      caption,
      location,
      mood,
      postedAt: new Date().toISOString(),
    });
    onClose();
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: G.cream,
    border: `1.5px solid ${G.border}`,
    borderRadius: 12,
    outline: "none",
    fontFamily: "Lora, Georgia, serif",
    fontSize: "0.9rem",
    color: G.text,
    boxSizing: "border-box",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,34,18,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl overflow-y-auto"
        style={{
          background: G.card,
          borderRadius: 24,
          border: `1.5px solid ${G.border}`,
          maxHeight: "90vh",
          boxShadow: "0 24px 60px rgba(42,31,21,0.22)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5"
          style={{ borderBottom: `1px solid ${G.border}` }}
        >
          <h2
            style={{
              fontFamily: "Playfair Display, serif",
              fontWeight: 700,
              fontSize: "1.25rem",
              color: G.text,
            }}
          >
            New Memory 🌸
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: G.textMd }}
            onMouseEnter={(e) => (e.currentTarget.style.background = G.cream)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "")}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          {/* Image area */}
          {imageData ? (
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{ background: G.cream }}
            >
              <img
                src={imageData}
                alt="preview"
                className="w-full max-h-72 object-cover"
              />
              <button
                type="button"
                onClick={() => setImageData(null)}
                className="absolute top-3 right-3 rounded-full p-1.5 transition-colors"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                readFile(e.dataTransfer.files[0]);
              }}
              className="rounded-2xl border-2 border-dashed p-8 text-center transition-colors"
              style={{
                borderColor: dragOver ? G.green : G.border,
                background: dragOver ? G.lightBg : G.cream,
              }}
            >
              <div className="text-5xl mb-4">🌸</div>
              <p
                style={{
                  color: G.textSm,
                  fontFamily: "Lora,serif",
                  marginBottom: 16,
                }}
              >
                Drag a photo here, or choose one:
              </p>
              <div className="flex gap-3 justify-center">
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => readFile(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => cameraRef.current.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors"
                  style={{
                    background: G.green,
                    color: "#fff",
                    fontFamily: "Lora,serif",
                    fontSize: "0.88rem",
                  }}
                >
                  <Camera size={17} /> Take Photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => readFile(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors"
                  style={{
                    background: G.cream,
                    color: G.textMd,
                    border: `1.5px solid ${G.border}`,
                    fontFamily: "Lora,serif",
                    fontSize: "0.88rem",
                  }}
                >
                  <Upload size={17} /> Upload
                </button>
              </div>
            </div>
          )}

          {/* Date */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "Lora,serif",
                fontSize: 13,
                fontWeight: 600,
                color: G.textMd,
                marginBottom: 6,
              }}
            >
              Date taken
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Caption */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "Lora,serif",
                fontSize: 13,
                fontWeight: 600,
                color: G.textMd,
                marginBottom: 6,
              }}
            >
              Your thoughts
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What were you feeling? Write freely…"
              rows={4}
              style={{ ...inputStyle, resize: "none" }}
            />
          </div>

          {/* Location */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "Lora,serif",
                fontSize: 13,
                fontWeight: 600,
                color: G.textMd,
                marginBottom: 6,
              }}
            >
              Location{" "}
              <span style={{ color: G.textSm, fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <div className="relative">
              <MapPin
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: G.textSm }}
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kathmandu, Nepal"
                style={{ ...inputStyle, paddingLeft: 38 }}
              />
            </div>
          </div>

          {/* Mood */}
          <div>
            <label
              style={{
                display: "block",
                fontFamily: "Lora,serif",
                fontSize: 13,
                fontWeight: 600,
                color: G.textMd,
                marginBottom: 8,
              }}
            >
              Mood
            </label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(mood === m ? "" : m)}
                  className="text-2xl p-2 rounded-xl transition-all"
                  style={{
                    background: mood === m ? G.lightBg : "transparent",
                    outline: mood === m ? `2px solid ${G.green}` : "none",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!imageData}
            className="w-full py-3 font-semibold rounded-2xl transition-all"
            style={{
              background: G.green,
              color: "#fff",
              fontFamily: "Lora,serif",
              fontSize: "0.95rem",
              fontWeight: 700,
              opacity: imageData ? 1 : 0.4,
              cursor: imageData ? "pointer" : "not-allowed",
            }}
          >
            🌸 Save Memory
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Lightbox ─────────────────────────────────────────────────────────────
function Lightbox({ memory, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,20,8,0.92)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full flex flex-col md:flex-row"
        style={{
          maxWidth: 900,
          background: G.card,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
          maxHeight: "90vh",
          border: `1.5px solid ${G.border}`,
        }}
      >
        <div
          className="md:w-3/5 flex items-center justify-center"
          style={{ background: "#111" }}
        >
          <img
            src={memory.imageData}
            alt=""
            className="max-h-[70vh] md:max-h-[90vh] w-full object-contain"
          />
        </div>
        <div className="md:w-2/5 p-8 flex flex-col overflow-y-auto">
          <button
            onClick={onClose}
            className="self-end p-2 rounded-full mb-4"
            style={{ color: G.textMd, background: G.cream }}
          >
            <X size={20} />
          </button>
          <p
            style={{
              fontFamily: "Lora,serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: G.gold,
              marginBottom: 6,
            }}
          >
            {fmtLong(memory.date)}
          </p>
          {memory.location && (
            <p
              className="flex items-center gap-1 mb-4"
              style={{
                fontSize: 13,
                color: G.textSm,
                fontFamily: "Lora,serif",
              }}
            >
              <MapPin size={13} /> {memory.location}
            </p>
          )}
          {memory.mood && <span className="text-4xl mb-4">{memory.mood}</span>}
          {memory.caption && (
            <p
              style={{
                color: G.textMd,
                lineHeight: 1.75,
                fontFamily: "Lora,serif",
                fontSize: "0.95rem",
              }}
            >
              {memory.caption}
            </p>
          )}
          <p
            className="mt-auto pt-4"
            style={{ fontSize: 11, color: G.textSm, fontFamily: "Lora,serif" }}
          >
            Saved{" "}
            {new Date(memory.postedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Memories() {
  const toast = useToast();

  const [memories, setMemories] = useState(loadMemories);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [expandedMonths, setExpandedMonths] = useState({});
  const postRefs = useRef({});

  const addMemory = useCallback(
    (m) => {
      const updated = [m, ...memories];
      setMemories(updated);
      saveMemories(updated);
    },
    [memories],
  );

  const deleteMemory = useCallback(
    (id) => {
      toast.confirm({
        message: "Delete this memory? It cannot be recovered.",
        confirmLabel: "Delete",
        onConfirm: () => {
          const updated = memories.filter((m) => m.id !== id);
          setMemories(updated);
          saveMemories(updated);
        },
      });
    },
    [memories, toast],
  );

  const grouped = memories.reduce((acc, m) => {
    const key = monthKey(m.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const scrollToPost = (id) =>
    postRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  const toggleMonth = (key) =>
    setExpandedMonths((p) => ({ ...p, [key]: !p[key] }));
  const sorted = [...memories].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: G.cream }}>
      <Navbar />

      {/* ── Hero header ── */}
      <header
        style={{ background: G.card, borderBottom: `1.5px solid ${G.border}` }}
      >
        <div className="container-fluid py-12">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <p
                style={{
                  fontFamily: "Lora,serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: G.gold,
                  marginBottom: 10,
                }}
              >
                ✦ Photo Diary ✦
              </p>
              <h1
                style={{
                  fontFamily: "Playfair Display,serif",
                  fontSize: "clamp(2.4rem,5vw,3.6rem)",
                  fontWeight: 700,
                  color: G.text,
                  lineHeight: 1.1,
                }}
              >
                My
                <br />
                <em style={{ color: G.green }}>Memories.</em>
              </h1>
              <p
                style={{
                  fontFamily: "Lora,serif",
                  color: G.textSm,
                  marginTop: 12,
                  maxWidth: 340,
                }}
              >
                Moments captured. Thoughts preserved. A private gallery of your
                life.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {memories.length > 0 && (
                <div className="text-right hidden sm:block">
                  <p
                    style={{
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: G.text,
                      fontFamily: "Playfair Display,serif",
                    }}
                  >
                    {memories.length}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: G.textSm,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      fontFamily: "Lora,serif",
                    }}
                  >
                    Memories
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all"
                style={{
                  background: G.green,
                  color: "#fff",
                  fontFamily: "Lora,serif",
                  boxShadow: "0 4px 16px rgba(78,126,64,0.3)",
                }}
              >
                <Plus size={20} /> New Memory
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-fluid py-10 flex-1">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-8xl mb-6 opacity-30">🌸</div>
            <h2
              style={{
                fontFamily: "Playfair Display,serif",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: G.textSm,
                marginBottom: 8,
              }}
            >
              No memories yet
            </h2>
            <p
              style={{
                color: G.textSm,
                fontFamily: "Lora,serif",
                marginBottom: 28,
              }}
            >
              Take a photo or upload one to begin your gallery.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold"
              style={{
                background: G.green,
                color: "#fff",
                fontFamily: "Lora,serif",
              }}
            >
              <Camera size={22} /> Add First Memory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            {/* Photo grid */}
            <div className="lg:col-span-3">
              <div
                className="flex items-center justify-between mb-8 pb-4"
                style={{ borderBottom: `1.5px solid ${G.border}` }}
              >
                <p
                  style={{
                    fontFamily: "Lora,serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: G.gold,
                  }}
                >
                  ✦ Gallery ✦
                </p>
                <p
                  style={{
                    fontFamily: "Lora,serif",
                    fontSize: 12,
                    color: G.textSm,
                  }}
                >
                  {memories.length} moment{memories.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div style={{ columns: 2, columnGap: "1.5rem" }}>
                {sorted.map((memory) => (
                  <article
                    key={memory.id}
                    ref={(el) => (postRefs.current[memory.id] = el)}
                    style={{
                      breakInside: "avoid",
                      marginBottom: "1.5rem",
                      display: "block",
                    }}
                    className="group"
                  >
                    <div
                      className="relative overflow-hidden rounded-2xl cursor-pointer"
                      style={{ background: G.border }}
                      onClick={() => setLightbox(memory)}
                    >
                      <img
                        src={memory.imageData}
                        alt=""
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ display: "block" }}
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center transition-all duration-300"
                        style={{ background: "rgba(0,0,0,0)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0,0,0,0.18)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(0,0,0,0)")
                        }
                      >
                        <ZoomIn
                          size={32}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      </div>
                      {memory.mood && (
                        <span
                          className="absolute top-3 left-3 text-xl flex items-center justify-center"
                          style={{
                            background: "rgba(253,252,248,0.85)",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                          }}
                        >
                          {memory.mood}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMemory(memory.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="px-1 pt-3 pb-1">
                      <p
                        style={{
                          fontFamily: "Lora,serif",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: G.gold,
                          marginBottom: 4,
                        }}
                      >
                        {fmtLong(memory.date)}
                      </p>
                      {memory.location && (
                        <p
                          className="flex items-center gap-1 mb-2"
                          style={{
                            fontSize: 12,
                            color: G.textSm,
                            fontFamily: "Lora,serif",
                          }}
                        >
                          <MapPin size={11} /> {memory.location}
                        </p>
                      )}
                      {memory.caption && (
                        <p
                          className="line-clamp-3"
                          style={{
                            fontFamily: "Lora,serif",
                            fontSize: "0.85rem",
                            color: G.textMd,
                            lineHeight: 1.65,
                          }}
                        >
                          {memory.caption}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* Timeline sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <p
                  style={{
                    fontFamily: "Lora,serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: G.gold,
                    marginBottom: 16,
                    paddingBottom: 12,
                    borderBottom: `1.5px solid ${G.border}`,
                  }}
                >
                  ✦ Timeline ✦
                </p>
                <div className="space-y-1">
                  {sortedMonths.map((mk) => {
                    const posts = grouped[mk].sort((a, b) =>
                      b.date.localeCompare(a.date),
                    );
                    const isExpanded = expandedMonths[mk] !== false;
                    return (
                      <div key={mk}>
                        <button
                          onClick={() => toggleMonth(mk)}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-xl transition-colors"
                          style={{ color: G.text }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = G.lightBg)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "")
                          }
                        >
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: G.green,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "Lora,serif",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                              }}
                            >
                              {monthLabel(mk + "-01")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              style={{
                                fontFamily: "Lora,serif",
                                fontSize: 11,
                                color: G.textSm,
                                background: G.cream,
                                padding: "2px 8px",
                                borderRadius: 100,
                              }}
                            >
                              {posts.length}
                            </span>
                            <ChevronDown
                              size={14}
                              style={{
                                color: G.textSm,
                                transform: isExpanded
                                  ? "none"
                                  : "rotate(-90deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          </div>
                        </button>
                        {isExpanded && (
                          <div
                            className="ml-4 pl-3 mb-2 space-y-1"
                            style={{ borderLeft: `1.5px solid ${G.border}` }}
                          >
                            {posts.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => scrollToPost(p.id)}
                                className="w-full text-left flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-colors"
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = G.lightBg)
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background = "")
                                }
                              >
                                <img
                                  src={p.imageData}
                                  alt=""
                                  className="rounded-lg object-cover flex-shrink-0"
                                  style={{ width: 32, height: 32 }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    style={{
                                      fontFamily: "Lora,serif",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: G.textMd,
                                    }}
                                  >
                                    {fmtShort(p.date)}
                                  </p>
                                  {p.caption && (
                                    <p
                                      className="truncate"
                                      style={{
                                        fontFamily: "Lora,serif",
                                        fontSize: 11,
                                        color: G.textSm,
                                      }}
                                    >
                                      {p.caption}
                                    </p>
                                  )}
                                </div>
                                {p.mood && (
                                  <span className="text-sm flex-shrink-0">
                                    {p.mood}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats */}
                <div
                  className="mt-8 p-4 rounded-2xl"
                  style={{
                    background: G.lightBg,
                    border: `1.5px solid #c8e0c0`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "Lora,serif",
                      fontSize: 11,
                      fontWeight: 700,
                      color: G.green,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 10,
                    }}
                  >
                    Your Stats
                  </p>
                  {[
                    ["Total moments", memories.length],
                    ["Months covered", sortedMonths.length],
                    ["With captions", memories.filter((m) => m.caption).length],
                  ].map(([label, val]) => (
                    <div
                      key={label}
                      className="flex justify-between"
                      style={{ marginBottom: 6 }}
                    >
                      <span
                        style={{
                          fontFamily: "Lora,serif",
                          fontSize: "0.84rem",
                          color: G.textMd,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontFamily: "Lora,serif",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          color: G.text,
                        }}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
      {showModal && (
        <AddModal onClose={() => setShowModal(false)} onAdd={addMemory} />
      )}
      {lightbox && (
        <Lightbox memory={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
