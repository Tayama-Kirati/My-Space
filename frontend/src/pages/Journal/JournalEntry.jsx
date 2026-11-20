import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft, Check, Trash2, Bold, Italic, List, ListOrdered,
  ImagePlus, Lock, Unlock, Settings, X, Eye, EyeOff,
} from "lucide-react";
import clsx from "clsx";
import { useToast } from "../../components/Toast";
import { readJSON, writeJSON, removeItem } from "../../utils/authPersistence";
import { adToBs, bsMonthName } from "../../utils/nepaliDate";
import { MOODS, normalizeMood } from "../../utils/moods";
import { Button, Card } from "../../components/ui";

// ── helpers (unchanged keys) ────────────────────────────────────────────────
const getJournalPw = () => localStorage.getItem("journal_pw");
const saveJournalPw = (pw) => (pw ? localStorage.setItem("journal_pw", btoa(pw)) : localStorage.removeItem("journal_pw"));
const checkJournalPw = (pw) => { const s = getJournalPw(); return !!s && btoa(pw) === s; };
const isSessionOpen = () => sessionStorage.getItem("jnl_open") === "1";
const openSession = () => sessionStorage.setItem("jnl_open", "1");

const getEntry = (k) => readJSON(`journal_${k}`, null);
function saveEntry(k, data) {
  writeJSON(`journal_${k}`, data);
  const index = new Set(readJSON("journal_index", []));
  index.add(k);
  writeJSON("journal_index", [...index]);
}
function deleteEntry(k) {
  removeItem(`journal_${k}`);
  const index = new Set(readJSON("journal_index", []));
  index.delete(k);
  writeJSON("journal_index", [...index]);
}
function dateHeader(key) {
  const [y, m, d] = key.split("-").map(Number);
  const jsd = new Date(y, m - 1, d);
  const bs = adToBs(jsd);
  const weekday = jsd.toLocaleDateString("en-US", { weekday: "long" });
  const ad = jsd.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  const bsStr = bs ? `${bsMonthName(bs.month)} ${bs.day}, ${bs.year}` : "";
  return `${weekday} · ${bsStr} · ${ad}`;
}
const toHtml = (raw) => {
  if (!raw) return "<p></p>";
  if (raw.trim().startsWith("<")) return raw;
  return raw.split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("") || "<p></p>";
};
const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// ── Toolbar ─────────────────────────────────────────────────────────────────
function Toolbar({ editor, onAddPhoto }) {
  if (!editor) return null;
  const Btn = ({ label, active, onClick, children }) => (
    <button type="button" aria-label={label} aria-pressed={active}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={clsx("min-w-[40px] h-10 flex items-center justify-center rounded-lg font-semibold transition-colors",
        active ? "bg-moss-t text-moss-d" : "text-ink-2 hover:bg-sunk hover:text-ink")}>
      {children}
    </button>
  );
  const Div = () => <span className="w-px bg-line my-1.5 mx-1" />;
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 p-1.5 border border-line rounded-[12px] bg-surface">
      <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Btn>
      <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Btn>
      <Div />
      <Btn label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</Btn>
      <Btn label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Div />
      <Btn label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
      <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
      <Div />
      <Btn label="Add photo" onClick={onAddPhoto}><ImagePlus size={16} /></Btn>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function JournalEntry() {
  const { date } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef();
  const existing = getEntry(date);

  const [title, setTitle] = useState(existing?.title || "");
  const [images, setImages] = useState(existing?.images || []);
  const [mood, setMood] = useState(() => normalizeMood(existing?.mood || ""));
  const [saved, setSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const [isPrivate, setIsPrivate] = useState(existing?.private || false);
  const [showGate, setShowGate] = useState(false);
  const [showSetPw, setShowSetPw] = useState(false);
  const [showPwMgmt, setShowPwMgmt] = useState(false);
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState("");
  const [newPw1, setNewPw1] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [pwError, setPwError] = useState("");

  const titleRef = useRef(title);
  const imagesRef = useRef(images);
  const moodRef = useRef(mood);
  const privRef = useRef(isPrivate);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { moodRef.current = mood; }, [mood]);
  useEffect(() => { privRef.current = isPrivate; }, [isPrivate]);

  useEffect(() => {
    if (existing?.private && !isSessionOpen()) setShowGate(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSave = useRef(null);

  const doSave = useCallback((html) => {
    saveEntry(date, {
      date,
      title: titleRef.current,
      content: html,
      images: imagesRef.current,
      mood: moodRef.current,
      private: privRef.current,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [date]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: toHtml(existing?.content),
    editorProps: { attributes: { class: "tiptap-journal focus:outline-none" } },
    onUpdate: ({ editor }) => {
      setWordCount(stripHtml(editor.getHTML()).split(/\s+/).filter(Boolean).length);
      clearTimeout(autoSave.current);
      autoSave.current = setTimeout(() => doSave(editor.getHTML()), 1500);
    },
  });

  useEffect(() => {
    if (existing?.content) setWordCount(stripHtml(existing.content).split(/\s+/).filter(Boolean).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    if (editor) { clearTimeout(autoSave.current); doSave(editor.getHTML()); }
    navigate("/journal");
  }, [editor, doSave, navigate]);

  const handleDelete = () => {
    toast.confirm({
      message: "Delete this entry? It cannot be recovered.",
      confirmLabel: "Delete entry",
      onConfirm: () => { clearTimeout(autoSave.current); deleteEntry(date); navigate("/journal"); },
    });
  };

  const togglePrivate = () => {
    if (isPrivate) {
      setIsPrivate(false); privRef.current = false;
      if (editor) doSave(editor.getHTML());
    } else if (!getJournalPw()) {
      setShowSetPw(true);
    } else {
      setIsPrivate(true); privRef.current = true;
      if (editor) doSave(editor.getHTML());
    }
  };

  const submitGate = () => {
    if (checkJournalPw(gateInput)) { openSession(); setShowGate(false); setGateInput(""); setGateError(""); }
    else setGateError("Incorrect password. Try again.");
  };
  const setPassword = () => {
    if (!newPw1) return setPwError("Please enter a password.");
    if (newPw1 !== newPw2) return setPwError("Passwords do not match.");
    saveJournalPw(newPw1); setIsPrivate(true); privRef.current = true; openSession();
    setShowSetPw(false); setNewPw1(""); setNewPw2(""); setPwError("");
    if (editor) doSave(editor.getHTML());
  };
  const changePassword = () => {
    if (!newPw1) return setPwError("Please enter a password.");
    if (newPw1 !== newPw2) return setPwError("Passwords do not match.");
    saveJournalPw(newPw1); setShowPwMgmt(false); setNewPw1(""); setNewPw2(""); setPwError("");
  };
  const removePassword = () => { saveJournalPw(null); setShowPwMgmt(false); };

  const addPhotos = (e) => {
    Array.from(e.target.files).forEach((file) => {
      const r = new FileReader();
      r.onload = (ev) => setImages((prev) => [...prev, ev.target.result]);
      r.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const locked = existing?.private && showGate;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {/* Sticky editor bar */}
      <header className="app-topbar sticky top-0 z-20 border-b border-line">
        <div className="wrap flex items-center justify-between gap-3 min-h-[64px] flex-wrap">
          <button onClick={() => navigate("/journal")} className="flex items-center gap-2 text-ink-2 hover:text-ink pl-2 py-2">
            <ArrowLeft size={18} /> Journal
          </button>
          <div className="flex items-center gap-2.5">
            {saved && <span className="flex items-center gap-1.5 text-moss text-[13px]"><Check size={15} /> Saved</span>}
            <button onClick={togglePrivate}
              className={clsx("flex items-center gap-1.5 px-3 h-10 rounded-ctl text-sm font-semibold border",
                isPrivate ? "bg-clay-t text-clay-ink border-clay-t" : "bg-sunk text-ink-2 border-line")}>
              {isPrivate ? <Lock size={15} /> : <Unlock size={15} />} {isPrivate ? "Private" : "Public"}
            </button>
            {getJournalPw() && (
              <button onClick={() => setShowPwMgmt(true)} aria-label="Manage password"
                className="w-10 h-10 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><Settings size={17} /></button>
            )}
            <button onClick={handleDelete} aria-label="Delete entry"
              className="w-10 h-10 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk"><Trash2 size={18} /></button>
            <Button onClick={finish}>Done</Button>
          </div>
        </div>
      </header>

      <main className="wrap flex-1 pt-10 pb-20">
        {locked ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-14 h-14 rounded-full bg-clay-t text-clay-ink flex items-center justify-center mx-auto mb-4"><Lock size={24} /></div>
            <h2 className="font-serif text-[24px] text-ink mb-4">This entry is private</h2>
            <input type="password" autoFocus value={gateInput} onChange={(e) => setGateInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitGate()} placeholder="Password"
              className="w-full h-11 px-3.5 bg-white border border-line rounded-ctl outline-none focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
            {gateError && <p className="text-clay-ink text-[13px] mt-2">{gateError}</p>}
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => navigate("/journal")}>Back</Button>
              <Button className="flex-1" onClick={submitGate}>Unlock</Button>
            </div>
          </div>
        ) : (
          <div className="max-w-[720px] mx-auto">
            <p className="eyebrow">{dateHeader(date)}</p>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled entry"
              className="w-full border-none bg-transparent outline-none font-serif font-medium text-[44px] text-ink mt-3 p-0 placeholder:text-ink-3/60" />

            {/* Moods */}
            <fieldset className="border-none p-0 mt-6">
              <legend className="text-[13px] font-semibold text-ink-2 mb-2.5">How are you feeling?</legend>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => {
                  const on = mood === m.name;
                  return (
                    <button key={m.name} type="button" onClick={() => setMood(on ? "" : m.name)} aria-pressed={on}
                      className={clsx("min-h-[40px] px-3.5 rounded-full border font-medium text-sm inline-flex items-center gap-2 transition-colors",
                        on ? "border-moss bg-moss-t text-moss-d" : "border-line bg-surface text-ink-2 hover:bg-sunk")}>
                      <span className="w-2 h-2 rounded-full" style={{ background: m.dot }} /> {m.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Toolbar */}
            <div className="mt-7 sticky top-[76px] z-10">
              <Toolbar editor={editor} onAddPhoto={() => fileRef.current.click()} />
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-5">
                {images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-28 rounded-ctl object-cover" />
                    <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove photo"
                      className="absolute top-1.5 right-1.5 rounded-full p-1 text-white" style={{ background: "rgba(0,0,0,.55)" }}><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="mt-6 min-h-[420px] font-serif text-[18px] leading-[1.8] text-ink journal-body">
              <EditorContent editor={editor} />
            </div>

            <div className="flex justify-between border-t border-line pt-4 mt-4 text-[13px] text-ink-3 flex-wrap gap-2">
              <span>{wordCount} words · ~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
              <span>Saves automatically as you type</span>
            </div>
          </div>
        )}
      </main>

      {/* Set password modal */}
      {showSetPw && (
        <PwModal title="Set a journal password" sub="Private entries are locked behind this password."
          onClose={() => { setShowSetPw(false); setPwError(""); }}
          pw1={newPw1} pw2={newPw2} setPw1={setNewPw1} setPw2={setNewPw2} visible={pwVisible} setVisible={setPwVisible}
          error={pwError} primaryLabel="Set password & make private" onPrimary={setPassword} />
      )}
      {/* Manage password modal */}
      {showPwMgmt && (
        <PwModal title="Journal password" sub="Change or remove your journal password."
          onClose={() => { setShowPwMgmt(false); setPwError(""); }}
          pw1={newPw1} pw2={newPw2} setPw1={setNewPw1} setPw2={setNewPw2} visible={pwVisible} setVisible={setPwVisible}
          error={pwError} primaryLabel="Change password" onPrimary={changePassword}
          secondaryLabel="Remove password" onSecondary={removePassword} />
      )}

      <style>{`
        .journal-body .tiptap-journal{outline:none;min-height:360px;}
        .journal-body .tiptap-journal p{margin:0 0 1rem;}
        .journal-body .tiptap-journal h1{font-size:1.9em;font-weight:500;margin:1rem 0 .5rem;}
        .journal-body .tiptap-journal h2{font-size:1.5em;font-weight:500;margin:1rem 0 .5rem;}
        .journal-body .tiptap-journal ul{list-style:disc;padding-left:1.4em;margin:0 0 1rem;}
        .journal-body .tiptap-journal ol{list-style:decimal;padding-left:1.4em;margin:0 0 1rem;}
        .journal-body .tiptap-journal p.is-editor-empty:first-child::before{
          content:"Write freely — what happened, what you noticed, what you want to remember…";
          color:var(--c-ink3);opacity:.6;font-style:italic;float:left;height:0;pointer-events:none;}
      `}</style>
    </div>
  );
}

function PwModal({ title, sub, onClose, pw1, pw2, setPw1, setPw2, visible, setVisible, error, primaryLabel, onPrimary, secondaryLabel, onSecondary }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(26,34,18,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Card className="p-7 w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-[22px] text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center rounded-full text-ink-2 hover:bg-sunk"><X size={18} /></button>
        </div>
        <p className="text-ink-2 text-sm mb-4">{sub}</p>
        <div className="space-y-3">
          <div className="relative">
            <input type={visible ? "text" : "password"} value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="New password"
              className="w-full h-11 px-3.5 pr-11 bg-white border border-line rounded-ctl outline-none focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
            <button type="button" onClick={() => setVisible((v) => !v)} aria-label="Toggle password visibility"
              className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-ink-2">{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          <input type={visible ? "text" : "password"} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Confirm password"
            className="w-full h-11 px-3.5 bg-white border border-line rounded-ctl outline-none focus:border-moss focus:ring-[3px] focus:ring-moss/20" />
          {error && <p className="text-clay-ink text-[13px]">{error}</p>}
          <Button className="w-full" onClick={onPrimary}>{primaryLabel}</Button>
          {secondaryLabel && (
            <button onClick={onSecondary} className="w-full text-[13px] text-clay-ink hover:underline py-1">{secondaryLabel}</button>
          )}
        </div>
      </Card>
    </div>
  );
}
