import React, { useState, useRef, useMemo } from "react";
import {
  Star, X, Calendar, ImagePlus, Bookmark, Trash2, CheckCheck,
  Sparkles, Loader2, Plus, Search, Pen,
} from "lucide-react";
import clsx from "clsx";
import AppLayout from "../layout/AppLayout";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import api from "../../services/api";
import { PageHeader, Card, Pill, Segmented, Button, StarRating } from "../ui";

const COVERS = [
  "#2F4F3A", "#2F4A6B", "#7A3B4C", "#7A5A22",
  "#3E3A66", "#7E3324", "#305E5E", "#4A4A3A",
];

const SORTS = [
  { value: "rating", label: "Highest rated" },
  { value: "recent", label: "Recently added" },
  { value: "title", label: "Title A–Z" },
];

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Cover ─────────────────────────────────────────────────────────────────
function Cover({ item, idx = 0, className, style }) {
  const bg = COVERS[idx % COVERS.length];
  return (
    <div
      className={clsx("relative overflow-hidden flex items-end p-3.5 text-white", className)}
      style={{ background: item.image ? "#1a1a1a" : bg, ...style }}
    >
      {item.image && (
        <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
      )}
      <span className="absolute left-0 top-0 bottom-0 w-2" style={{ background: "rgba(0,0,0,.18)" }} />
      {!item.image && (
        <b className="relative font-serif font-medium text-[15px] leading-tight">{item.title}</b>
      )}
    </div>
  );
}

// ── Log / Wishlist modal ───────────────────────────────────────────────────
function EntryModal({ cfg, mode, prefill, onClose, onSave }) {
  const isWish = mode === "wishlist";
  const [form, setForm] = useState({
    title: prefill?.title || "",
    creator: prefill?.[cfg.creatorField] || "",
    year: prefill?.year || (cfg.hasYear ? new Date().getFullYear() : ""),
    genre: prefill?.genre || cfg.genres[0],
    description: "",
    review: "",
    notes: "",
    rating: 5,
    dateAdded: new Date().toISOString().split("T")[0],
  });
  const [image, setImage] = useState(prefill?.image || null);
  const fileRef = useRef();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const base = {
      title: form.title.trim(),
      [cfg.creatorField]: form.creator.trim(),
      genre: form.genre,
      image: image || null,
      ...(cfg.hasYear ? { year: form.year ? Number(form.year) : null } : {}),
    };
    if (isWish) {
      onSave({ ...base, notes: form.notes, id: `${cfg.kind[0]}w-${Date.now()}` });
    } else {
      onSave({
        ...base,
        description: form.description,
        review: form.review,
        rating: form.rating,
        dateAdded: form.dateAdded,
        id: Date.now(),
        featured: false,
      });
    }
    onClose();
  };

  const ctl = "w-full h-11 px-3.5 bg-white border border-line rounded-ctl outline-none text-ink focus:border-moss focus:ring-[3px] focus:ring-moss/20";
  const area = "w-full px-3.5 py-3 bg-white border border-line rounded-ctl outline-none text-ink resize-none focus:border-moss focus:ring-[3px] focus:ring-moss/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(26,34,18,.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-xl bg-surface border border-line rounded-[20px] overflow-y-auto" style={{ maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-7 py-5 border-b border-line">
          <div>
            <p className="eyebrow">{isWish ? cfg.wishEyebrow : cfg.logEyebrow}</p>
            <h2 className="font-serif font-medium text-[22px] text-ink mt-0.5">
              {isWish ? cfg.wishTitle : prefill ? cfg.markTitle : cfg.logTitle}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full text-ink-2 hover:bg-sunk">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="px-7 py-6 space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Cover image {isWish && <span className="text-ink-3 font-normal">(optional)</span>}</label>
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="cover" className="h-40 rounded-ctl object-cover" />
                <button type="button" onClick={() => setImage(null)}
                  className="absolute top-2 right-2 rounded-full p-1.5 text-white" style={{ background: "rgba(0,0,0,.55)" }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current.click()}
                className="w-full flex flex-col items-center gap-1.5 py-6 rounded-ctl border-2 border-dashed border-line text-ink-3 hover:border-moss hover:text-moss transition-colors">
                <ImagePlus size={22} /> <span className="text-sm">Upload cover photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files[0])} />
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Title *</label>
              <input className={ctl} value={form.title} onChange={set("title")} required />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">{cfg.creatorLabel}</label>
              <input className={ctl} value={form.creator} onChange={set("creator")} />
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Genre</label>
              <select className={ctl} value={form.genre} onChange={set("genre")}>
                {cfg.genres.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            {cfg.hasYear && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Year</label>
                <input type="number" className={ctl} value={form.year} onChange={set("year")} />
              </div>
            )}
            {!isWish && (
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">{cfg.dateLabel}</label>
                <input type="date" className={ctl} value={form.dateAdded} onChange={set("dateAdded")} />
              </div>
            )}
          </div>

          {isWish ? (
            <div>
              <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">Why do you want to {cfg.verb} this?</label>
              <textarea rows={3} className={area} value={form.notes} onChange={set("notes")} />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">What is it about?</label>
                <textarea rows={3} className={area} value={form.description} onChange={set("description")} />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-2 mb-1.5">My review & thoughts</label>
                <textarea rows={4} className={area} value={form.review} onChange={set("review")} />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-ink-2 mb-2">My rating</label>
                <StarRating value={form.rating} size={26} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
              </div>
            </>
          )}

          <Button type="submit" icon={isWish ? Bookmark : Pen} className="w-full">
            {isWish ? "Add to wishlist" : prefill ? cfg.markCta : cfg.logCta}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LibraryPage({ config }) {
  const cfg = config;
  const [items, setItems] = useState(() => readJSON(cfg.readKey, []));
  const [wishlist, setWishlist] = useState(() => (readJSON(cfg.wishlistKey, []) || []));
  const [tab, setTab] = useState("read");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");
  const [modal, setModal] = useState(null); // { mode, prefill }
  const [marking, setMarking] = useState(null);

  const [ai, setAi] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const persistItems = (next) => { setItems(next); writeJSON(cfg.readKey, next); };
  const persistWish = (next) => { setWishlist(next); writeJSON(cfg.wishlistKey, next); };

  const addItem = (it) => persistItems([it, ...items]);
  const addWish = (it) => persistWish([it, ...wishlist]);
  const removeWish = (id) => persistWish(wishlist.filter((w) => w.id !== id));

  const markAsRead = (entry) => {
    addItem(entry);
    if (marking) removeWish(marking.id);
    setMarking(null);
    setTab("read");
  };

  const fetchAi = async () => {
    setAiLoading(true); setAi(null);
    try {
      const { data } = await api.post("/ai/suggest", { type: cfg.aiType, items });
      setAi(data.suggestions || []);
    } catch {
      setAi([]);
    } finally {
      setAiLoading(false);
    }
  };

  const avg = items.length ? (items.reduce((s, b) => s + (b.rating || 0), 0) / items.length).toFixed(1) : "0.0";
  const featured = items.find((b) => b.featured) || items[0];

  const sorted = useMemo(() => {
    const arr = [...items];
    if (sort === "rating") arr.sort((a, b) => (b.rating - a.rating) || (new Date(b.dateAdded) - new Date(a.dateAdded)));
    else if (sort === "recent") arr.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    else arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr;
  }, [items, sort]);

  const q = search.trim().toLowerCase();
  const matches = (it) =>
    !q || it.title.toLowerCase().includes(q) || (it[cfg.creatorField] || "").toLowerCase().includes(q);

  const gridItems = (q ? sorted.filter(matches) : sorted.filter((b) => b.id !== featured?.id));

  const tabs = [
    { value: "read", label: cfg.readTab, count: items.length },
    { value: "wishlist", label: cfg.wishTab, count: wishlist.length },
    { value: "suggestions", label: "Suggestions", icon: Sparkles },
  ];

  return (
    <AppLayout>
      <PageHeader
        eyebrow={cfg.eyebrow}
        title={cfg.title}
        subtitle={cfg.subtitle}
        stats={[
          { value: items.length, label: cfg.readWord },
          { value: avg, label: "avg rating" },
          { value: wishlist.length, label: cfg.wishWord },
        ]}
        action={<Button icon={Plus} onClick={() => setModal({ mode: "log" })}>{cfg.logCta}</Button>}
      />

      {/* Favourite */}
      {tab === "read" && !q && featured && (
        <Card className="mb-9 overflow-hidden">
          <div className="flex gap-7 p-7 items-center flex-wrap">
            <Cover item={featured} idx={0} className="rounded-[8px] w-[150px] flex-shrink-0 aspect-[2/3] shadow-cover" />
            <div style={{ flex: "1 1 360px", minWidth: 0 }}>
              <div className="flex gap-2 mb-2.5 flex-wrap">
                <Pill tone="moss">{cfg.favLabel}</Pill>
                {featured.genre && <Pill>{featured.genre}</Pill>}
              </div>
              <h2 className="font-serif font-medium text-[26px] text-ink">{featured.title}</h2>
              <p className="text-[13px] text-ink-3 mt-1">
                {featured[cfg.creatorField]}
                {cfg.hasYear && featured.year ? ` · ${featured.year}` : ""}
                {featured.dateAdded ? ` · ${cfg.finishedWord} ${fmtDate(featured.dateAdded)}` : ""}
              </p>
              {featured.review && (
                <blockquote className="font-serif italic text-[18px] text-ink-2 mt-4 pl-4 border-l-[3px] border-gold">
                  {featured.review}
                </blockquote>
              )}
              <div className="mt-3.5"><StarRating value={featured.rating} /></div>
            </div>
          </div>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex gap-3 items-center flex-wrap py-4 border-t border-b border-line mb-7">
        <Segmented options={tabs} value={tab} onChange={setTab} ariaLabel="Library view" role="tablist" />
        {tab !== "suggestions" && (
          <>
            <div className="relative flex-1 min-w-[180px] max-w-[320px] ml-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                aria-label={`Search ${cfg.kind}`} placeholder={`Search ${cfg.kind}`}
                className="w-full h-11 pl-9 pr-3 bg-white border border-line rounded-ctl outline-none text-ink focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
            </div>
            {tab === "read" && (
              <label className="text-[13px] text-ink-3 flex items-center gap-2">
                Sort
                <select value={sort} onChange={(e) => setSort(e.target.value)}
                  className="h-11 px-3 rounded-ctl border border-line bg-surface font-medium text-ink-2">
                  {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            )}
          </>
        )}
      </div>

      {/* Read grid */}
      {tab === "read" && (
        gridItems.length === 0 ? (
          <Empty icon={cfg.icon} title={`No ${cfg.kind} logged yet`} sub={`Log the first ${cfg.noun} you ${cfg.pastVerb}.`}
            cta={<Button icon={Plus} onClick={() => setModal({ mode: "log" })}>{cfg.logCta}</Button>} />
        ) : (
          <div className="grid gap-x-[22px] gap-y-7 pb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            {gridItems.map((it, i) => (
              <div key={it.id} className="flex flex-col gap-2.5 text-ink">
                <Cover item={it} idx={i} className="rounded-[8px] aspect-[2/3] shadow-cover" />
                <div>
                  <p className="font-semibold text-sm">{it.title}</p>
                  <p className="text-[13px] text-ink-3">
                    {it[cfg.creatorField]}{cfg.hasYear && it.year ? ` · ${it.year}` : ""}
                  </p>
                  <div className="mt-1.5"><StarRating value={it.rating} size={13} /></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Wishlist */}
      {tab === "wishlist" && (
        <>
          <div className="flex justify-end mb-5">
            <Button variant="secondary" icon={Bookmark} onClick={() => setModal({ mode: "wishlist" })}>
              Add to wishlist
            </Button>
          </div>
          {(q ? wishlist.filter(matches) : wishlist).length === 0 ? (
            <Empty icon={Bookmark} title="Your wishlist is empty" sub={`Add ${cfg.kind} you want to ${cfg.verb} next.`}
              cta={<Button icon={Bookmark} onClick={() => setModal({ mode: "wishlist" })}>Add to wishlist</Button>} />
          ) : (
            <div className="grid gap-x-[22px] gap-y-7 pb-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {(q ? wishlist.filter(matches) : wishlist).map((it, i) => (
                <div key={it.id} className="flex flex-col gap-2.5 text-ink">
                  <Cover item={it} idx={i} className="rounded-[8px] aspect-[2/3] shadow-cover" />
                  <div>
                    {it.genre && <Pill className="mb-1">{it.genre}</Pill>}
                    <p className="font-semibold text-sm">{it.title}</p>
                    {it[cfg.creatorField] && <p className="text-[13px] text-ink-3">{it[cfg.creatorField]}</p>}
                    {it.notes && <p className="text-[13px] text-ink-2 italic mt-1">“{it.notes}”</p>}
                    <div className="flex gap-2 mt-2.5">
                      <Button variant="secondary" icon={CheckCheck} iconSize={14}
                        className="text-[13px] min-h-[36px] px-3"
                        onClick={() => { setMarking(it); setModal({ mode: "log", prefill: it }); }}>
                        {cfg.markCta}
                      </Button>
                      <button onClick={() => removeWish(it.id)} aria-label="Remove"
                        className="w-9 h-9 flex items-center justify-center rounded-ctl border border-line text-ink-2 hover:bg-sunk">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Suggestions */}
      {tab === "suggestions" && (
        <div className="pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <p className="text-ink-2 text-sm max-w-[480px]">
              Personalised picks from Claude, based on {cfg.kind} you've rated.
            </p>
            <Button icon={aiLoading ? undefined : Sparkles} onClick={fetchAi} disabled={aiLoading}>
              {aiLoading ? <><Loader2 size={16} className="spin" /> Thinking…</> : ai ? "Refresh" : "Get suggestions"}
            </Button>
          </div>
          {aiLoading ? (
            <div className="flex flex-col items-center py-20 text-ink-3">
              <Loader2 size={34} className="spin text-moss" />
              <p className="mt-4">Claude is reading your taste…</p>
            </div>
          ) : ai && ai.length > 0 ? (
            <div className="grid gap-x-[22px] gap-y-7" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {ai.map((s, i) => (
                <div key={i} className="flex flex-col gap-2.5">
                  <Cover item={{ title: s.title }} idx={i} className="rounded-[8px] aspect-[2/3] shadow-cover" />
                  <div>
                    {s.genre && <Pill className="mb-1">{s.genre}</Pill>}
                    <p className="font-semibold text-sm text-ink">{s.title}</p>
                    <p className="text-[13px] text-ink-3">{s.author || s.director}</p>
                    <p className="text-[13px] text-ink-2 italic mt-1">{s.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : ai ? (
            <Empty icon={Sparkles} title="Couldn't load suggestions"
              sub="Make sure the backend is running and the API key is set." />
          ) : (
            <Empty icon={Sparkles} title={`Discover your next ${cfg.noun}`}
              sub={`Log a few ${cfg.kind} first, then let Claude suggest what to ${cfg.verb} next.`}
              cta={<Button icon={Sparkles} onClick={fetchAi}>Get suggestions</Button>} />
          )}
        </div>
      )}

      {modal && (
        <EntryModal
          cfg={cfg}
          mode={modal.mode}
          prefill={modal.prefill}
          onClose={() => { setModal(null); setMarking(null); }}
          onSave={modal.mode === "wishlist" ? addWish : (marking ? markAsRead : addItem)}
        />
      )}
    </AppLayout>
  );
}

function Empty({ icon: Icon, title, sub, cta }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-sunk text-ink-3 flex items-center justify-center mb-4">
        <Icon size={26} />
      </div>
      <h3 className="font-serif text-[22px] text-ink-2 mb-1.5">{title}</h3>
      <p className="text-ink-3 mb-6">{sub}</p>
      {cta}
    </div>
  );
}

export { Star };
