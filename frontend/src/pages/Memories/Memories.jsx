import React, { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Upload, X, Plus, MapPin, Trash2 } from "lucide-react";
import clsx from "clsx";
import AppLayout from "../../components/layout/AppLayout";
import { useToast } from "../../components/Toast";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import { PageHeader, Button, Placeholder } from "../../components/ui";

const loadMemories = () => readJSON("memories", []);
const saveMemories = (m) => writeJSON("memories", m);
const todayISO = () => new Date().toISOString().split("T")[0];

function fmtLong(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function monthKey(iso) {
  return iso.slice(0, 7);
}
function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const MOODS = ["😊", "😐", "😢", "🤩", "😴", "😤", "🥰", "😰"];

// ── Add modal ───────────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [imageData, setImageData] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [mood, setMood] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target.result);
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!imageData) return;
    onAdd({ id: Date.now(), imageData, date, caption, location, mood, postedAt: new Date().toISOString() });
    onClose();
  };

  const ctl = "w-full px-3.5 py-2.5 bg-white border border-line rounded-ctl outline-none text-ink focus:border-moss focus:ring-[3px] focus:ring-moss/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,34,18,.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-surface border border-line rounded-[20px] overflow-y-auto" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-line">
          <h2 className="font-serif font-medium text-[22px] text-ink">New memory</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full text-ink-2 hover:bg-sunk">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="px-7 py-6 space-y-5">
          {imageData ? (
            <div className="relative rounded-2xl overflow-hidden bg-sunk">
              <img src={imageData} alt="preview" className="w-full max-h-72 object-cover" />
              <button type="button" onClick={() => setImageData(null)}
                className="absolute top-3 right-3 rounded-full p-1.5 text-white" style={{ background: "rgba(0,0,0,.55)" }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); readFile(e.dataTransfer.files[0]); }}
              className={clsx("rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
                dragOver ? "border-moss bg-moss-t" : "border-line bg-sunk")}>
              <div className="w-12 h-12 rounded-full bg-moss-t text-moss-d flex items-center justify-center mx-auto mb-3">
                <Camera size={22} />
              </div>
              <p className="text-ink-3 mb-4">Drag a photo here, or choose one:</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0])} />
              <Button type="button" icon={Upload} onClick={() => fileRef.current.click()}>Upload photo</Button>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Date taken</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={ctl} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Caption</label>
            <textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="What were you feeling?" className={clsx(ctl, "resize-none")} />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Location <span className="text-ink-3 font-normal">(optional)</span></label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kathmandu, Nepal" className={clsx(ctl, "pl-9")} />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-2">Mood</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button key={m} type="button" onClick={() => setMood(mood === m ? "" : m)}
                  className={clsx("text-2xl p-2 rounded-xl transition-all", mood === m ? "bg-moss-t ring-2 ring-moss" : "")}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={!imageData} className={clsx("w-full", !imageData && "opacity-40 cursor-not-allowed")}>
            Save memory
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ memory, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,20,8,.92)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full flex flex-col md:flex-row bg-surface border border-line rounded-[20px] overflow-hidden"
        style={{ maxWidth: 900, maxHeight: "90vh" }}>
        <div className="md:w-3/5 flex items-center justify-center" style={{ background: "#111" }}>
          <img src={memory.imageData} alt="" className="max-h-[70vh] md:max-h-[90vh] w-full object-contain" />
        </div>
        <div className="md:w-2/5 p-7 flex flex-col overflow-y-auto">
          <button onClick={onClose} aria-label="Close" className="self-end w-9 h-9 flex items-center justify-center rounded-full text-ink-2 bg-sunk mb-4">
            <X size={20} />
          </button>
          <p className="eyebrow text-gold">{fmtLong(memory.date)}</p>
          {memory.location && (
            <p className="flex items-center gap-1 mt-2 text-[13px] text-ink-3"><MapPin size={13} /> {memory.location}</p>
          )}
          {memory.mood && <span className="text-4xl mt-4">{memory.mood}</span>}
          {memory.caption && <p className="text-ink-2 leading-relaxed mt-4">{memory.caption}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Memories() {
  const toast = useToast();
  const [memories, setMemories] = useState(loadMemories);
  const [showModal, setShowModal] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [monthFilter, setMonthFilter] = useState("all");

  const addMemory = useCallback((m) => {
    setMemories((prev) => {
      const updated = [m, ...prev];
      saveMemories(updated);
      return updated;
    });
  }, []);

  const deleteMemory = useCallback((id) => {
    toast.confirm({
      message: "Delete this memory? It cannot be recovered.",
      confirmLabel: "Delete",
      onConfirm: () =>
        setMemories((prev) => {
          const updated = prev.filter((m) => m.id !== id);
          saveMemories(updated);
          return updated;
        }),
    });
  }, [toast]);

  const sorted = [...memories].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const months = [...new Set(sorted.map((m) => monthKey(m.date)))];
  const places = new Set(memories.filter((m) => m.location).map((m) => m.location)).size;
  const visible = monthFilter === "all" ? sorted : sorted.filter((m) => monthKey(m.date) === monthFilter);

  return (
    <AppLayout>
      <PageHeader
        eyebrow="Memories"
        title="Moments worth keeping."
        subtitle="A private photo diary — trips, people, and the small everyday things."
        stats={[{ value: memories.length, label: "memories" }, { value: places, label: "places" }]}
        action={<Button icon={Plus} onClick={() => setShowModal(true)}>New memory</Button>}
      />

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <Placeholder className="rounded-2xl w-20 h-20 mb-5" iconSize={28} />
          <h2 className="font-serif text-[22px] text-ink-2 mb-2">No memories yet</h2>
          <p className="text-ink-3 mb-6">Upload a photo to begin your gallery.</p>
          <Button icon={Camera} onClick={() => setShowModal(true)}>Add first memory</Button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-6" role="group" aria-label="Filter by month">
            <Chip active={monthFilter === "all"} onClick={() => setMonthFilter("all")}>All</Chip>
            {months.map((mk) => (
              <Chip key={mk} active={monthFilter === mk} onClick={() => setMonthFilter(mk)}>
                {monthLabel(mk)}
              </Chip>
            ))}
          </div>

          <div className="masonry pb-4">
            {visible.map((m) => (
              <div key={m.id} className="group">
                <div className="relative overflow-hidden rounded-[14px] cursor-pointer" onClick={() => setLightbox(m)}>
                  <img src={m.imageData} alt="" className="w-full object-cover block transition-transform duration-500 group-hover:scale-[1.03]" />
                  {m.mood && (
                    <span className="absolute top-2.5 left-2.5 w-9 h-9 rounded-full flex items-center justify-center text-lg"
                      style={{ background: "rgba(253,252,248,.85)" }}>{m.mood}</span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteMemory(m.id); }}
                    aria-label="Delete memory"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,.5)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="pt-2.5">
                  {m.caption && <p className="font-semibold text-sm text-ink">{m.caption}</p>}
                  <p className="text-[13px] text-ink-3 flex items-center gap-1.5 mt-0.5">
                    {fmtLong(m.date)}
                    {m.location && <><span>·</span><MapPin size={12} /> {m.location}</>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={addMemory} />}
      {lightbox && <Lightbox memory={lightbox} onClose={() => setLightbox(null)} />}
    </AppLayout>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={clsx("min-h-[36px] px-3.5 rounded-full border text-[13px] font-medium transition-colors",
        active ? "bg-ink border-ink text-white" : "bg-surface border-line text-ink-2 hover:bg-sunk")}>
      {children}
    </button>
  );
}
