import React, { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Save,
  Trash2,
  Image as ImageIcon,
  X,
  BookOpen,
  Clock,
  Type,
  CheckCircle,
  Bold,
  Italic,
  List,
  ListOrdered,
  Minus,
} from "lucide-react";
import { useToast } from "../../components/Toast";
import { readJSON, writeJSON, removeItem } from "../../utils/authPersistence";
import "./JournalEntry.css";

// ── localStorage helpers ──────────────────────────────────────────────────
function getEntry(dateKey) {
  return readJSON(`journal_${dateKey}`, null);
}
function saveEntry(dateKey, data) {
  writeJSON(`journal_${dateKey}`, data);
  const index = new Set(readJSON("journal_index", []));
  index.add(dateKey);
  writeJSON("journal_index", [...index]);
}
function deleteEntry(dateKey) {
  removeItem(`journal_${dateKey}`);
  const index = new Set(readJSON("journal_index", []));
  index.delete(dateKey);
  writeJSON("journal_index", [...index]);
}
function formatDisplayDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
    full: date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}
function isToday(key) {
  const t = new Date();
  return (
    key ===
    `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
  );
}
function toHtml(raw) {
  if (!raw) return "<p></p>";
  if (raw.trim().startsWith("<")) return raw;
  // Convert plain-text legacy content to HTML paragraphs
  return (
    raw
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("") || "<p></p>"
  );
}
function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Toolbar ───────────────────────────────────────────────────────────────
function EditorToolbar({ editor }) {
  if (!editor) return null;

  const Btn = ({ title, active, onClick, children }) => (
    <button
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`jnl-tb-btn ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "2px",
        padding: "8px 12px",
        borderBottom: "1px solid #e8e0d0",
        background: "#faf8f4",
      }}
    >
      <Btn
        title="Bold (Ctrl+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </Btn>
      <Btn
        title="Italic (Ctrl+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </Btn>

      <div className="jnl-tb-sep" />

      <Btn
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Btn>
      <Btn
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Btn>
      <Btn
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Btn>

      <div className="jnl-tb-sep" />

      <Btn
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={14} />
      </Btn>
      <Btn
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={14} />
      </Btn>

      <div className="jnl-tb-sep" />

      <Btn
        title="Horizontal rule"
        active={false}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus size={14} />
      </Btn>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function JournalEntry() {
  const { date } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  // Load existing entry synchronously so editor gets correct initial content
  const existing = getEntry(date);

  const toast = useToast();

  const [title, setTitle] = useState(existing?.title || "");
  const [images, setImages] = useState(existing?.images || []);
  const [mood, setMood] = useState(existing?.mood || "");
  const [saved, setSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Use refs for latest values in stable callbacks
  const titleRef = useRef(title);
  const imagesRef = useRef(images);
  const moodRef = useRef(mood);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const autoSaveTimer = useRef(null);

  const MOODS = ["😊", "😐", "😢", "😤", "😴", "🤩", "😰", "🥰"];

  const doSave = useCallback(
    (html) => {
      saveEntry(date, {
        date,
        title: titleRef.current,
        content: html,
        images: imagesRef.current,
        mood: moodRef.current,
        updatedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [date],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: toHtml(existing?.content),
    editorProps: {
      attributes: {
        class: "tiptap-journal",
        "data-placeholder": "What's on your mind today? Write freely…",
      },
    },
    onUpdate: ({ editor }) => {
      const text = stripHtml(editor.getHTML());
      setWordCount(text.split(/\s+/).filter(Boolean).length);
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => doSave(editor.getHTML()), 1500);
    },
  });

  // Init word count from existing content
  useEffect(() => {
    if (existing?.content) {
      const text = stripHtml(existing.content);
      setWordCount(text.split(/\s+/).filter(Boolean).length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = useCallback(() => {
    if (!editor) return;
    clearTimeout(autoSaveTimer.current);
    doSave(editor.getHTML());
    navigate("/journal");
  }, [editor, doSave, navigate]);

  const handleDelete = () => {
    toast.confirm({
      message: "Delete this entry? It cannot be recovered.",
      confirmLabel: "Delete entry",
      onConfirm: () => {
        clearTimeout(autoSaveTimer.current);
        deleteEntry(date);
        navigate("/journal");
      },
    });
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  const removeImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const { weekday, full } = formatDisplayDate(date);
  const todayEntry = isToday(date);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#f5f0e8" }}
    >
      {/* Top Bar */}
      <header
        className="sticky top-0 z-50 shadow-sm"
        style={{ background: "#fdfcf8", borderBottom: "1.5px solid #d4c5a9" }}
      >
        <div className="container-fluid flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/journal")}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-700 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Calendar
          </button>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium animate-pulse">
                <CheckCircle size={16} /> Saved
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: "#4e7e40", fontFamily: "Lora,serif" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#3d6632")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4e7e40")
              }
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-red-50 hover:bg-red-100 text-red-600"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="py-10 px-6 lg:px-16 xl:px-24 flex-1 max-w-screen-xl mx-auto w-full">
        {/* Date Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary-600 text-white rounded-xl p-3">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
                {weekday}
              </p>
              <h1 className="text-3xl font-bold text-gray-900">{full}</h1>
            </div>
            {todayEntry && (
              <span className="ml-auto bg-primary-100 text-primary-700 text-xs font-bold px-3 py-1 rounded-full border border-primary-200">
                Today
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 mt-3">
            <span className="flex items-center gap-1">
              <Type size={12} /> {wordCount} words
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> ~{Math.ceil(wordCount / 200)} min read
            </span>
            {images.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon size={12} /> {images.length} photo
                {images.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Mood Picker */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-sm"
          style={{ background: "#fdfcf8", border: "1.5px solid #d4c5a9" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "#7a6a50", fontFamily: "Lora,serif" }}
          >
            How are you feeling?
          </p>
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? "" : m)}
                className="text-2xl p-2 rounded-xl transition-all"
                style={
                  mood === m
                    ? {
                        background: "#e8f5e2",
                        transform: "scale(1.1)",
                        outline: "2px solid #4e7e40",
                      }
                    : {}
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Card */}
        <div
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{ background: "#fdfcf8", border: "1.5px solid #d4c5a9" }}
        >
          {/* Title */}
          <div
            className="px-10 pt-10 pb-5"
            style={{ borderBottom: "1px solid #e8e0d0" }}
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title…"
              className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 outline-none bg-transparent"
            />
          </div>

          {/* Rich text toolbar */}
          <EditorToolbar editor={editor} />

          {/* Rich text content */}
          <EditorContent editor={editor} />

          {/* Image upload zone */}
          <div className="px-10 pb-10">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleImages}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {images.map((src, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100"
                  >
                    <img
                      src={src}
                      alt={`entry-img-${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium border-2 border-dashed border-primary-200 hover:border-primary-400 px-4 py-3 rounded-xl w-full justify-center transition-colors"
            >
              <ImageIcon size={18} />
              Add Photos
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Auto-saved as you type · Stored locally on your device
        </p>
      </main>
    </div>
  );
}
