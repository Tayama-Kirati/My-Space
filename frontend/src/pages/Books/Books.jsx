import React, { useState, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  Star,
  X,
  Calendar,
  User,
  BookOpen,
  PenLine,
  ImagePlus,
  Bookmark,
  Trash2,
  CheckCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import api from "../../services/api";
import "./Books.css";

const COVER_PALETTES = [
  "cover-midnight",
  "cover-forest",
  "cover-rose",
  "cover-indigo",
  "cover-amber",
  "cover-slate",
  "cover-crimson",
  "cover-teal",
];

const GENRES = [
  "Literary Fiction",
  "Historical Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Non-Fiction",
  "Biography",
  "Poetry",
  "Other",
];


function sortByRating(arr) {
  return [...arr].sort(
    (a, b) =>
      b.rating - a.rating || new Date(b.dateAdded) - new Date(a.dateAdded),
  );
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function isNew(iso) {
  return (Date.now() - new Date(iso)) / 86400000 <= 21;
}
const LEGACY_SEED_IDS = new Set(["bw1", "bw2", "bw3"]);

function loadWishlist() {
  const stored = readJSON("books_wishlist", []) || [];
  const cleaned = stored.filter((item) => !LEGACY_SEED_IDS.has(item.id));
  if (cleaned.length !== stored.length) writeJSON("books_wishlist", cleaned);
  return cleaned;
}
function saveWishlist(list) {
  writeJSON("books_wishlist", list);
}

function StarDisplay({ rating, size = "normal" }) {
  return (
    <div className={size === "small" ? "card-stars" : "star-row"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size === "small" ? 13 : 18}
          fill={n <= rating ? "#c9a84c" : "none"}
          className={
            n <= rating
              ? size === "small"
                ? "card-star"
                : "star"
              : size === "small"
                ? "card-star empty"
                : "star empty"
          }
        />
      ))}
    </div>
  );
}

function BookCoverArt({
  title,
  author,
  palette,
  image,
  className = "card-cover-art",
}) {
  const isCard = className === "card-cover-art";
  if (image) {
    return (
      <div className={`${className} cover-photo`}>
        <img src={image} alt={title} className="book-real-img" />
        <div className="cover-photo-overlay" />
        <span className={isCard ? "card-cover-title" : "book-cover-title"}>
          {title}
        </span>
        <span className={isCard ? "card-cover-author" : "book-cover-author"}>
          {author}
        </span>
      </div>
    );
  }
  return (
    <div className={`${className} ${palette}`}>
      <span className={isCard ? "card-cover-title" : "book-cover-title"}>
        {title}
      </span>
      <span className={isCard ? "card-cover-author" : "book-cover-author"}>
        {author}
      </span>
    </div>
  );
}

function WriteBookModal({ onClose, onAdd, prefill = null }) {
  const [form, setForm] = useState({
    title: prefill?.title || "",
    author: prefill?.author || "",
    genre: prefill?.genre || GENRES[0],
    description: "",
    review: "",
    rating: 5,
    dateAdded: new Date().toISOString().split("T")[0],
  });
  const [image, setImage] = useState(prefill?.image || null);
  const [hover, setHover] = useState(0);
  const fileRef = useRef();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    onAdd({
      ...form,
      image: image || null,
      id: Date.now(),
      palette:
        COVER_PALETTES[Math.floor(Math.random() * COVER_PALETTES.length)],
      featured: false,
    });
    onClose();
  };
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Reading Log</p>
            <h2 className="modal-title">
              {prefill
                ? "Log This Book as Read"
                : "Write About a Book You Read"}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Book Cover Image</label>
            {image ? (
              <div className="cover-preview">
                <img
                  src={image}
                  alt="cover preview"
                  className="cover-preview-img"
                />
                <button
                  type="button"
                  className="cover-preview-remove"
                  onClick={() => setImage(null)}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="cover-upload-zone"
                onClick={() => fileRef.current.click()}
              >
                <ImagePlus size={22} />
                <span>Upload book cover photo</span>
                <span className="cover-upload-hint">JPG, PNG or WEBP</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => readFile(e.target.files[0])}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Book Title *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. The Alchemist"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Author *</label>
              <input
                className="form-input"
                value={form.author}
                onChange={set("author")}
                placeholder="e.g. Paulo Coelho"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Genre</label>
              <select
                className="form-select"
                value={form.genre}
                onChange={set("genre")}
              >
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label className="form-label">Date Finished</label>
              <input
                type="date"
                className="form-input"
                value={form.dateAdded}
                onChange={set("dateAdded")}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">What is it about?</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={set("description")}
              placeholder="A short summary..."
              rows={3}
            />
          </div>
          <div className="form-field">
            <label className="form-label">My Review & Thoughts</label>
            <textarea
              className="form-textarea form-textarea--tall"
              value={form.review}
              onChange={set("review")}
              placeholder="How did this book make you feel? What stayed with you?"
              rows={5}
            />
          </div>
          <div className="form-field">
            <label className="form-label">My Rating</label>
            <div className="star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`star-btn ${n <= (hover || form.rating) ? "filled" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                >
                  ★
                </button>
              ))}
              <span className="rating-label">
                {(hover || form.rating) === 5 && "Amazing — a new favourite"}
                {(hover || form.rating) === 4 && "Really good"}
                {(hover || form.rating) === 3 && "Decent read"}
                {(hover || form.rating) === 2 && "Not for me"}
                {(hover || form.rating) === 1 && "Didn't enjoy it"}
              </span>
            </div>
          </div>
          <button type="submit" className="modal-submit">
            <PenLine size={15} />{" "}
            {prefill ? "Add to Read List" : "Add to My Reading List"}
          </button>
        </form>
      </div>
    </div>
  );
}

function WishlistModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: "",
    author: "",
    genre: GENRES[0],
    notes: "",
  });
  const [image, setImage] = useState(null);
  const fileRef = useRef();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target.result);
    reader.readAsDataURL(file);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      image: image || null,
      id: `bw-${Date.now()}`,
      palette:
        COVER_PALETTES[Math.floor(Math.random() * COVER_PALETTES.length)],
    });
    onClose();
  };
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Reading Wishlist</p>
            <h2 className="modal-title">Add a Book to Your Wishlist</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Cover Image (optional)</label>
            {image ? (
              <div className="cover-preview">
                <img src={image} alt="cover" className="cover-preview-img" />
                <button
                  type="button"
                  className="cover-preview-remove"
                  onClick={() => setImage(null)}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="cover-upload-zone"
                onClick={() => fileRef.current.click()}
              >
                <ImagePlus size={20} />
                <span>Upload cover (optional)</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => readFile(e.target.files[0])}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                value={form.title}
                onChange={set("title")}
                placeholder="Book title"
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label">Author</label>
              <input
                className="form-input"
                value={form.author}
                onChange={set("author")}
                placeholder="Author name"
              />
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Genre</label>
            <select
              className="form-select"
              value={form.genre}
              onChange={set("genre")}
            >
              {GENRES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Why do you want to read this?</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={set("notes")}
              placeholder="A friend recommended it, I saw it mentioned somewhere..."
              rows={3}
            />
          </div>
          <button type="submit" className="modal-submit wl-submit">
            <Bookmark size={15} /> Add to Wishlist
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Books() {
  const [tab, setTab] = useState("read");
  const [books, setBooks] = useState([]);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const fetchAiSuggestions = async () => {
    setShowAiPanel(true);
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const { data } = await api.post("/ai/suggest", { type: "books", items: books });
      setAiSuggestions(data.suggestions);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const addBook = (book) => setBooks((prev) => sortByRating([book, ...prev]));

  const addToWishlist = (item) => {
    const updated = [item, ...wishlist];
    setWishlist(updated);
    saveWishlist(updated);
  };
  const removeFromWishlist = (id) => {
    const updated = wishlist.filter((w) => w.id !== id);
    setWishlist(updated);
    saveWishlist(updated);
  };
  const handleMarkAsRead = (book) => {
    addBook(book);
    if (markingAsRead) removeFromWishlist(markingAsRead.id);
    setMarkingAsRead(null);
    setTab("read");
  };

  const featured = books.find((b) => b.featured) || books[0];
  const rest = books.filter((b) => b.id !== featured?.id);

  const totalRead = books.length;
  const avgRating = books.length
    ? (books.reduce((s, b) => s + b.rating, 0) / books.length).toFixed(1)
    : "—";
  const fiveStars = books.filter((b) => b.rating === 5).length;

  return (
    <div className="books-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="books-hero">
        <div className="hero-inner">
          <div>
            <p className="hero-eyebrow">My Personal Reading Log</p>
            <h1 className="hero-title">
              Books I Have
              <br />
              <em>Read So Far.</em>
            </h1>
            <p className="hero-subtitle">
              Every book I have finished — with honest thoughts, personal
              reflections, and a star rating. Sorted from most loved to least.
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">{totalRead}</span>
                <span className="hero-stat-label">Books Read</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">{avgRating}</span>
                <span className="hero-stat-label">Avg Rating</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">{wishlist.length}</span>
                <span className="hero-stat-label">On Wishlist</span>
              </div>
            </div>
            <div className="hero-actions">
              <button
                className="hero-cta"
                onClick={() => setShowWriteModal(true)}
              >
                <PenLine size={16} /> Log a Book
              </button>
              <button
                className="hero-cta-ghost"
                onClick={() => {
                  setTab("wishlist");
                  document
                    .querySelector(".books-tab-bar")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Bookmark size={16} /> View Wishlist
              </button>
              <button className="hero-cta-ghost" onClick={fetchAiSuggestions}>
                <Sparkles size={16} /> AI Suggest
              </button>
            </div>
          </div>
          <div className="hero-book-stack">
            {books.slice(0, 3).map((b, i) => (
              <div
                key={b.id}
                className={`hero-cover ${i === 0 ? "main" : "side"}`}
              >
                <BookCoverArt
                  title={b.title}
                  author={b.author}
                  palette={b.palette}
                  image={b.image}
                  className="book-cover-art"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tab bar ── */}
      <div className="books-tab-wrap">
        <div className="books-tab-bar">
          <button
            className={`books-tab ${tab === "read" ? "active" : ""}`}
            onClick={() => setTab("read")}
          >
            <BookOpen size={15} /> Read{" "}
            <span className="tab-count">{books.length}</span>
          </button>
          <button
            className={`books-tab ${tab === "wishlist" ? "active" : ""}`}
            onClick={() => setTab("wishlist")}
          >
            <Bookmark size={15} /> Want to Read{" "}
            <span className="tab-count">{wishlist.length}</span>
          </button>
        </div>
      </div>

      {tab === "read" ? (
        <>
          {/* ── Featured book ── */}
          {featured && (
            <div className="books-section" style={{ paddingBottom: "1rem" }}>
              <div className="section-header">
                <div>
                  <p className="section-eyebrow">Top Pick</p>
                  <h2 className="section-title">My Favourite Read</h2>
                </div>
              </div>
              <div className="featured-book">
                <div className="featured-cover-wrap">
                  <BookCoverArt
                    title={featured.title}
                    author={featured.author}
                    palette={featured.palette}
                    image={featured.image}
                    className="featured-cover-art"
                  />
                </div>
                <div className="featured-content">
                  <div
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {isNew(featured.dateAdded) && (
                      <span className="new-tag">Recently Read</span>
                    )}
                    <span className="book-genre-tag">{featured.genre}</span>
                  </div>
                  <div className="date-added">
                    <Calendar size={12} /> Finished{" "}
                    {formatDate(featured.dateAdded)}
                  </div>
                  <h2 className="book-title-large">{featured.title}</h2>
                  <div className="book-author">
                    <User size={13} /> {featured.author}
                  </div>
                  <p className="book-description">{featured.description}</p>
                  <p className="my-review-label">My Thoughts</p>
                  <p className="my-review-text">{featured.review}</p>
                  <StarDisplay rating={featured.rating} />
                </div>
              </div>
            </div>
          )}

          {/* ── All books grid ── */}
          <div className="books-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">
                  Full Reading List — Highest Rated First
                </p>
                <h2 className="section-title">All Books I've Read</h2>
              </div>
              <button
                className="add-book-btn"
                onClick={() => setShowWriteModal(true)}
              >
                <PenLine size={16} /> Log a Book
              </button>
            </div>
            {rest.length === 0 ? (
              <div className="no-books">
                <div className="no-books-icon">
                  <BookOpen />
                </div>
                <h3>No books logged yet</h3>
                <p>Start by logging the first book you have read.</p>
                <button
                  className="hero-cta"
                  style={{ marginTop: "1rem" }}
                  onClick={() => setShowWriteModal(true)}
                >
                  <PenLine size={15} /> Log a Book
                </button>
              </div>
            ) : (
              <div className="book-grid">
                {rest.map((book) => (
                  <article key={book.id} className="book-card">
                    <div className="card-cover">
                      <BookCoverArt
                        title={book.title}
                        author={book.author}
                        palette={book.palette}
                        image={book.image}
                        className="card-cover-art"
                      />
                      <div className="card-rating-badge">
                        {"★".repeat(book.rating)}
                        {"☆".repeat(5 - book.rating)}
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="card-meta">
                        <span className="card-date">
                          <Calendar size={11} /> {formatDate(book.dateAdded)}
                        </span>
                        {isNew(book.dateAdded) && (
                          <span
                            className="new-tag"
                            style={{ fontSize: "0.55rem" }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <h3 className="card-title">{book.title}</h3>
                      <div className="card-author">
                        <User size={11} /> {book.author}
                      </div>
                      {book.description && (
                        <p className="card-desc">{book.description}</p>
                      )}
                      {book.review && (
                        <>
                          <p className="card-review-label">My Thoughts</p>
                          <p className="card-review">{book.review}</p>
                        </>
                      )}
                      <StarDisplay rating={book.rating} size="small" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ── Wishlist tab ── */
        <div className="books-section">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Books I Want to Read Next</p>
              <h2 className="section-title">My Reading Wishlist</h2>
            </div>
            <button
              className="add-book-btn wl-btn"
              onClick={() => setShowWishlistModal(true)}
            >
              <Bookmark size={16} /> Add to Wishlist
            </button>
          </div>
          {wishlist.length === 0 ? (
            <div className="no-books">
              <div className="no-books-icon">
                <Bookmark />
              </div>
              <h3>Your wishlist is empty</h3>
              <p>Add books you want to read next.</p>
              <button
                className="hero-cta"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowWishlistModal(true)}
              >
                <Bookmark size={15} /> Add a Book
              </button>
            </div>
          ) : (
            <div className="wishlist-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-card">
                  <div className="wl-card-cover">
                    <BookCoverArt
                      title={item.title}
                      author={item.author || "—"}
                      palette={item.palette}
                      image={item.image}
                      className="card-cover-art"
                    />
                    <span className="wl-badge">
                      <Bookmark size={11} /> Wishlist
                    </span>
                  </div>
                  <div className="wl-card-body">
                    <span className="book-genre-tag">{item.genre}</span>
                    <h3 className="wl-title">{item.title}</h3>
                    {item.author && (
                      <div className="card-author">
                        <User size={11} /> {item.author}
                      </div>
                    )}
                    {item.notes && <p className="wl-notes">"{item.notes}"</p>}
                    <div className="wl-actions">
                      <button
                        className="wl-read-btn"
                        onClick={() => {
                          setMarkingAsRead(item);
                          setShowWriteModal(true);
                        }}
                      >
                        <CheckCheck size={14} /> Mark as Read
                      </button>
                      <button
                        className="wl-remove-btn"
                        onClick={() => removeFromWishlist(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Suggestions Panel ── */}
      {showAiPanel && (
        <div className="books-section">
          <div className="section-header">
            <div>
              <p className="section-eyebrow">Powered by Claude AI</p>
              <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={22} style={{ color: "#4e7e40" }} /> Books You Might Love
              </h2>
            </div>
            <button
              className="add-book-btn"
              onClick={fetchAiSuggestions}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
              {aiLoading ? "Thinking…" : "Refresh"}
            </button>
          </div>

          {aiLoading ? (
            <div className="no-books">
              <Loader2 size={36} className="spin" style={{ color: "#4e7e40" }} />
              <p style={{ marginTop: "1rem", color: "#7a6a50" }}>Claude is reading your taste…</p>
            </div>
          ) : aiSuggestions && aiSuggestions.length > 0 ? (
            <div className="book-grid">
              {aiSuggestions.map((s, i) => (
                <div key={i} className="book-card" style={{ border: "1.5px solid #d4c5a9" }}>
                  <div className={`card-cover-art ${COVER_PALETTES[i % COVER_PALETTES.length]}`}
                    style={{ borderRadius: "8px 8px 0 0" }}>
                    <span className="card-cover-title">{s.title}</span>
                    <span className="card-cover-author">{s.author}</span>
                  </div>
                  <div className="card-body">
                    <span className="book-genre-tag">{s.genre}</span>
                    <h3 className="card-title" style={{ marginTop: "0.5rem" }}>{s.title}</h3>
                    <div className="card-author"><User size={11} /> {s.author}</div>
                    <p className="card-desc" style={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                      {s.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-books">
              <p>Could not load suggestions. Make sure the backend is running and your API key is set.</p>
            </div>
          )}
        </div>
      )}

      <Footer />

      {showWriteModal && (
        <WriteBookModal
          onClose={() => {
            setShowWriteModal(false);
            setMarkingAsRead(null);
          }}
          onAdd={markingAsRead ? handleMarkAsRead : addBook}
          prefill={markingAsRead}
        />
      )}
      {showWishlistModal && (
        <WishlistModal
          onClose={() => setShowWishlistModal(false)}
          onAdd={addToWishlist}
        />
      )}
    </div>
  );
}
