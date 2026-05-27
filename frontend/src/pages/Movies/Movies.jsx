import React, { useState, useRef } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  Star,
  X,
  Calendar,
  Film,
  Clock,
  Globe,
  PenLine,
  ImagePlus,
  Clapperboard,
  BookOpen,
  Bookmark,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { readJSON, writeJSON } from "../../utils/authPersistence";
import "./Movies.css";

const COVER_PALETTES = [
  "mc-midnight",
  "mc-ocean",
  "mc-forest",
  "mc-rose",
  "mc-indigo",
  "mc-amber",
  "mc-slate",
  "mc-crimson",
];

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Documentary",
  "Musical",
  "Other",
];

const MY_MOVIES = [
  {
    id: 1,
    title: "Spirited Away",
    director: "Hayao Miyazaki",
    year: 2001,
    duration: "2h 5m",
    language: "Japanese",
    genre: "Animation",
    description:
      "Ten-year-old Chihiro stumbles into a spirit world ruled by the witch Yubaba. To rescue her parents and return home, she must work in a magical bathhouse.",
    review:
      "Absolutely perfect. Every single frame is a painting. The world-building is so rich and imaginative — it feels genuinely alive. My favourite film of all time.",
    rating: 5,
    dateWatched: "2026-04-18",
    palette: "mc-ocean",
    featured: true,
    image: null,
  },
  {
    id: 2,
    title: "My Neighbor Totoro",
    director: "Hayao Miyazaki",
    year: 1988,
    duration: "1h 26m",
    language: "Japanese",
    genre: "Animation",
    description:
      "Two young girls move to the countryside and discover the forest is home to magical creatures, including the giant, gentle spirit Totoro.",
    review:
      "Pure joy. There is no villain, no conflict — just wonder and warmth. This film feels like a hug.",
    rating: 5,
    dateWatched: "2026-03-10",
    palette: "mc-forest",
    featured: false,
    image: null,
  },
  {
    id: 3,
    title: "Howl's Moving Castle",
    director: "Hayao Miyazaki",
    year: 2004,
    duration: "1h 59m",
    language: "Japanese",
    genre: "Fantasy",
    description:
      "Sophie, a young hat-maker, is cursed by a witch and turned into an old woman. She seeks refuge in the moving castle of the wizard Howl.",
    review:
      "The aesthetics alone are worth it — that walking castle is one of cinema's great images. A film about love, self-worth, and finding courage.",
    rating: 5,
    dateWatched: "2026-02-14",
    palette: "mc-indigo",
    featured: false,
    image: null,
  },
  {
    id: 4,
    title: "Ponyo",
    director: "Hayao Miyazaki",
    year: 2008,
    duration: "1h 41m",
    language: "Japanese",
    genre: "Animation",
    description:
      "A five-year-old boy develops a relationship with Ponyo, a young goldfish princess who longs to become human.",
    review:
      "Simpler than Spirited Away but no less beautiful. The flooding sequence is visually breathtaking.",
    rating: 4,
    dateWatched: "2026-01-22",
    palette: "mc-rose",
    featured: false,
    image: null,
  },
  {
    id: 5,
    title: "Kiki's Delivery Service",
    director: "Hayao Miyazaki",
    year: 1989,
    duration: "1h 43m",
    language: "Japanese",
    genre: "Animation",
    description:
      "A young witch named Kiki moves to a new town and starts a delivery service, learning what it means to grow up and find her path.",
    review:
      "A quiet coming-of-age story. Kiki losing her magic as she loses confidence hit unexpectedly hard.",
    rating: 4,
    dateWatched: "2025-12-28",
    palette: "mc-amber",
    featured: false,
    image: null,
  },
];

const MOVIE_WISHLIST_SEED = [
  {
    id: "mw1",
    title: "Princess Mononoke",
    director: "Hayao Miyazaki",
    year: 1997,
    genre: "Animation",
    notes: "The Ghibli film I am most excited to see.",
    palette: "mc-forest",
    image: null,
  },
  {
    id: "mw2",
    title: "The Tale of Princess Kaguya",
    director: "Isao Takahata",
    year: 2013,
    genre: "Animation",
    notes: "The art style looks like a watercolour painting.",
    palette: "mc-slate",
    image: null,
  },
  {
    id: "mw3",
    title: "Castle in the Sky",
    director: "Hayao Miyazaki",
    year: 1986,
    genre: "Animation",
    notes: "Classic Ghibli adventure I have not gotten to yet.",
    palette: "mc-amber",
    image: null,
  },
];

function sortByRating(arr) {
  return [...arr].sort(
    (a, b) =>
      b.rating - a.rating || new Date(b.dateWatched) - new Date(a.dateWatched),
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
function loadWishlist() {
  return (
    readJSON("movies_wishlist", MOVIE_WISHLIST_SEED) || MOVIE_WISHLIST_SEED
  );
}
function saveWishlist(list) {
  writeJSON("movies_wishlist", list);
}

function StarDisplay({ rating, size = "normal" }) {
  return (
    <div className={size === "small" ? "mv-card-stars" : "mv-star-row"}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size === "small" ? 13 : 18}
          fill={n <= rating ? "#c9a84c" : "none"}
          className={
            n <= rating
              ? size === "small"
                ? "mv-card-star"
                : "mv-star"
              : size === "small"
                ? "mv-card-star empty"
                : "mv-star empty"
          }
        />
      ))}
    </div>
  );
}

function RatingCircle({ rating }) {
  const r = 28,
    circ = 2 * Math.PI * r,
    dash = (rating / 5) * circ;
  return (
    <div className="mv-rating-circle">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="rgba(78,126,64,0.15)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="#c9a84c"
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="mv-rating-num">
        {rating}
        <span className="mv-rating-denom">/5</span>
      </span>
    </div>
  );
}

function MoviePoster({
  title,
  director,
  palette,
  image,
  className = "mv-card-poster",
}) {
  const isCard = className === "mv-card-poster";
  if (image) {
    return (
      <div className={`${className} mv-real-poster`}>
        <img src={image} alt={title} className="mv-poster-img" />
        <div className="mv-poster-overlay" />
        <span className={isCard ? "mv-card-ptitle" : "mv-feat-ptitle"}>
          {title}
        </span>
        <span className={isCard ? "mv-card-pdir" : "mv-feat-pdir"}>
          {director}
        </span>
      </div>
    );
  }
  return (
    <div className={`${className} ${palette}`}>
      <Clapperboard size={isCard ? 28 : 42} className="mv-poster-icon" />
      <span className={isCard ? "mv-card-ptitle" : "mv-feat-ptitle"}>
        {title}
      </span>
      <span className={isCard ? "mv-card-pdir" : "mv-feat-pdir"}>
        {director}
      </span>
    </div>
  );
}

function LogMovieModal({ onClose, onAdd, prefill = null }) {
  const [form, setForm] = useState({
    title: prefill?.title || "",
    director: prefill?.director || "",
    year: prefill?.year || new Date().getFullYear(),
    duration: "",
    language: "",
    genre: prefill?.genre || GENRES[0],
    description: "",
    review: "",
    rating: 5,
    dateWatched: new Date().toISOString().split("T")[0],
  });
  const [image, setImage] = useState(null);
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
    if (!form.title.trim()) return;
    onAdd({
      ...form,
      year: Number(form.year),
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
      className="mv-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mv-modal">
        <div className="mv-modal-hdr">
          <div>
            <p className="mv-modal-eyebrow">Movie Log</p>
            <h2 className="mv-modal-title">
              {prefill ? "Log This Film as Watched" : "Log a Movie You Watched"}
            </h2>
          </div>
          <button className="mv-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="mv-modal-body" onSubmit={handleSubmit}>
          <div className="mv-form-field">
            <label className="mv-form-label">Poster / Screenshot</label>
            {image ? (
              <div className="mv-cover-preview">
                <img
                  src={image}
                  alt="preview"
                  className="mv-cover-preview-img"
                />
                <button
                  type="button"
                  className="mv-cover-remove"
                  onClick={() => setImage(null)}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mv-upload-zone"
                onClick={() => fileRef.current.click()}
              >
                <ImagePlus size={22} />
                <span>Upload poster or screenshot</span>
                <span className="mv-upload-hint">JPG, PNG or WEBP</span>
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
          <div className="mv-form-row">
            <div className="mv-form-field">
              <label className="mv-form-label">Movie Title *</label>
              <input
                className="mv-form-input"
                value={form.title}
                onChange={set("title")}
                placeholder="e.g. Spirited Away"
                required
              />
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Director</label>
              <input
                className="mv-form-input"
                value={form.director}
                onChange={set("director")}
                placeholder="e.g. Hayao Miyazaki"
              />
            </div>
          </div>
          <div className="mv-form-row mv-form-row-3">
            <div className="mv-form-field">
              <label className="mv-form-label">Year</label>
              <input
                type="number"
                className="mv-form-input"
                value={form.year}
                onChange={set("year")}
                min="1888"
                max="2099"
              />
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Duration</label>
              <input
                className="mv-form-input"
                value={form.duration}
                onChange={set("duration")}
                placeholder="e.g. 2h 5m"
              />
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Language</label>
              <input
                className="mv-form-input"
                value={form.language}
                onChange={set("language")}
                placeholder="e.g. Japanese"
              />
            </div>
          </div>
          <div className="mv-form-row">
            <div className="mv-form-field">
              <label className="mv-form-label">Genre</label>
              <select
                className="mv-form-select"
                value={form.genre}
                onChange={set("genre")}
              >
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Date Watched</label>
              <input
                type="date"
                className="mv-form-input"
                value={form.dateWatched}
                onChange={set("dateWatched")}
              />
            </div>
          </div>
          <div className="mv-form-field">
            <label className="mv-form-label">What is it about?</label>
            <textarea
              className="mv-form-textarea"
              value={form.description}
              onChange={set("description")}
              placeholder="A short plot summary..."
              rows={3}
            />
          </div>
          <div className="mv-form-field">
            <label className="mv-form-label">My Review & Thoughts</label>
            <textarea
              className="mv-form-textarea mv-form-textarea--tall"
              value={form.review}
              onChange={set("review")}
              placeholder="How did this film make you feel?"
              rows={4}
            />
          </div>
          <div className="mv-form-field">
            <label className="mv-form-label">My Rating</label>
            <div className="mv-star-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`mv-star-btn ${n <= (hover || form.rating) ? "filled" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                >
                  ★
                </button>
              ))}
              <span className="mv-rating-label">
                {(hover || form.rating) === 5 && "Masterpiece"}
                {(hover || form.rating) === 4 && "Really good"}
                {(hover || form.rating) === 3 && "Decent watch"}
                {(hover || form.rating) === 2 && "Not for me"}
                {(hover || form.rating) === 1 && "Didn't enjoy it"}
              </span>
            </div>
          </div>
          <button type="submit" className="mv-submit">
            {prefill ? (
              <>
                <CheckCheck size={15} /> Add to Watched List
              </>
            ) : (
              <>
                <Film size={15} /> Add to My Watchlist
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function WishlistMovieModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: "",
    director: "",
    year: "",
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
      year: form.year ? Number(form.year) : null,
      image: image || null,
      id: `mw-${Date.now()}`,
      palette:
        COVER_PALETTES[Math.floor(Math.random() * COVER_PALETTES.length)],
    });
    onClose();
  };
  return (
    <div
      className="mv-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="mv-modal">
        <div className="mv-modal-hdr">
          <div>
            <p className="mv-modal-eyebrow">Movie Wishlist</p>
            <h2 className="mv-modal-title">Add a Film to Your Wishlist</h2>
          </div>
          <button className="mv-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="mv-modal-body" onSubmit={handleSubmit}>
          <div className="mv-form-field">
            <label className="mv-form-label">Poster (optional)</label>
            {image ? (
              <div className="mv-cover-preview">
                <img
                  src={image}
                  alt="preview"
                  className="mv-cover-preview-img"
                />
                <button
                  type="button"
                  className="mv-cover-remove"
                  onClick={() => setImage(null)}
                >
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="mv-upload-zone"
                onClick={() => fileRef.current.click()}
              >
                <ImagePlus size={20} />
                <span>Upload poster (optional)</span>
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
          <div className="mv-form-row">
            <div className="mv-form-field">
              <label className="mv-form-label">Title *</label>
              <input
                className="mv-form-input"
                value={form.title}
                onChange={set("title")}
                placeholder="Film title"
                required
              />
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Director</label>
              <input
                className="mv-form-input"
                value={form.director}
                onChange={set("director")}
                placeholder="Director name"
              />
            </div>
          </div>
          <div className="mv-form-row">
            <div className="mv-form-field">
              <label className="mv-form-label">Year</label>
              <input
                type="number"
                className="mv-form-input"
                value={form.year}
                onChange={set("year")}
                placeholder="e.g. 1997"
                min="1888"
                max="2099"
              />
            </div>
            <div className="mv-form-field">
              <label className="mv-form-label">Genre</label>
              <select
                className="mv-form-select"
                value={form.genre}
                onChange={set("genre")}
              >
                {GENRES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mv-form-field">
            <label className="mv-form-label">
              Why do you want to watch this?
            </label>
            <textarea
              className="mv-form-textarea"
              value={form.notes}
              onChange={set("notes")}
              placeholder="Someone recommended it, I've heard great things..."
              rows={3}
            />
          </div>
          <button type="submit" className="mv-submit mv-wl-submit">
            <Bookmark size={15} /> Add to Wishlist
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Movies() {
  const [tab, setTab] = useState("watched");
  const [movies, setMovies] = useState(() => sortByRating(MY_MOVIES));
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [markingAsWatched, setMarkingAsWatched] = useState(null);

  const addMovie = (movie) =>
    setMovies((prev) => sortByRating([movie, ...prev]));
  const addToWishlist = (item) => {
    const u = [item, ...wishlist];
    setWishlist(u);
    saveWishlist(u);
  };
  const removeFromWishlist = (id) => {
    const u = wishlist.filter((w) => w.id !== id);
    setWishlist(u);
    saveWishlist(u);
  };
  const handleMarkAsWatched = (movie) => {
    addMovie(movie);
    if (markingAsWatched) removeFromWishlist(markingAsWatched.id);
    setMarkingAsWatched(null);
    setTab("watched");
  };

  const featured = movies.find((m) => m.featured) || movies[0];
  const rest = movies.filter((m) => m.id !== featured?.id);
  const total = movies.length;
  const avgRating = (
    movies.reduce((s, m) => s + m.rating, 0) / movies.length
  ).toFixed(1);
  const perfect = movies.filter((m) => m.rating === 5).length;

  return (
    <div className="mv-page">
      <Navbar />

      {/* ── Hero ── */}
      <section className="mv-hero">
        <div className="mv-hero-inner">
          <div>
            <p className="mv-hero-eyebrow">My Personal Movie Log</p>
            <h1 className="mv-hero-title">
              Movies I Have
              <br />
              <em>Watched.</em>
            </h1>
            <p className="mv-hero-subtitle">
              Every film I have seen — with personal reviews, star ratings, and
              the details that matter. Sorted from most loved to least.
            </p>
            <div className="mv-hero-stats">
              <div className="mv-stat">
                <span className="mv-stat-num">{total}</span>
                <span className="mv-stat-label">Films Watched</span>
              </div>
              <div className="mv-stat-div" />
              <div className="mv-stat">
                <span className="mv-stat-num">{avgRating}</span>
                <span className="mv-stat-label">Avg Rating</span>
              </div>
              <div className="mv-stat-div" />
              <div className="mv-stat">
                <span className="mv-stat-num">{wishlist.length}</span>
                <span className="mv-stat-label">On Wishlist</span>
              </div>
            </div>
            <div className="mv-hero-actions">
              <button
                className="mv-hero-cta"
                onClick={() => setShowLogModal(true)}
              >
                <PenLine size={16} /> Log a Movie
              </button>
              <button
                className="mv-hero-cta-ghost"
                onClick={() => {
                  setTab("wishlist");
                  document
                    .querySelector(".mv-tab-bar")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Bookmark size={16} /> View Wishlist
              </button>
            </div>
          </div>
          <div className="mv-poster-stack">
            {movies.slice(0, 3).map((m, i) => (
              <div
                key={m.id}
                className={`mv-hero-poster ${i === 0 ? "main" : "side"}`}
              >
                <MoviePoster
                  title={m.title}
                  director={m.director}
                  palette={m.palette}
                  image={m.image}
                  className="mv-hero-poster-art"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tab bar ── */}
      <div className="mv-tab-wrap">
        <div className="mv-tab-bar">
          <button
            className={`mv-tab ${tab === "watched" ? "active" : ""}`}
            onClick={() => setTab("watched")}
          >
            <Film size={15} /> Watched{" "}
            <span className="mv-tab-count">{movies.length}</span>
          </button>
          <button
            className={`mv-tab ${tab === "wishlist" ? "active" : ""}`}
            onClick={() => setTab("wishlist")}
          >
            <Bookmark size={15} /> Want to Watch{" "}
            <span className="mv-tab-count">{wishlist.length}</span>
          </button>
        </div>
      </div>

      {tab === "watched" ? (
        <>
          {/* Featured */}
          {featured && (
            <div className="mv-section" style={{ paddingBottom: "1rem" }}>
              <div className="mv-section-hdr">
                <div>
                  <p className="mv-section-eyebrow">Spotlight</p>
                  <h2 className="mv-section-title">My Favourite Film</h2>
                </div>
              </div>
              <div className="mv-featured">
                <div className="mv-feat-poster-wrap">
                  <MoviePoster
                    title={featured.title}
                    director={featured.director}
                    palette={featured.palette}
                    image={featured.image}
                    className="mv-feat-poster"
                  />
                </div>
                <div className="mv-feat-content">
                  <div className="mv-feat-tags">
                    {isNew(featured.dateWatched) && (
                      <span className="mv-new-tag">Recently Watched</span>
                    )}
                    <span className="mv-genre-tag">{featured.genre}</span>
                  </div>
                  <div className="mv-feat-meta-row">
                    {featured.year && (
                      <span className="mv-meta-chip">
                        <Calendar size={11} /> {featured.year}
                      </span>
                    )}
                    {featured.duration && (
                      <span className="mv-meta-chip">
                        <Clock size={11} /> {featured.duration}
                      </span>
                    )}
                    {featured.language && (
                      <span className="mv-meta-chip">
                        <Globe size={11} /> {featured.language}
                      </span>
                    )}
                  </div>
                  <h2 className="mv-feat-title">{featured.title}</h2>
                  <div className="mv-feat-director">
                    <Film size={13} /> Dir. {featured.director}
                  </div>
                  <div className="mv-feat-body-row">
                    <div className="mv-feat-text">
                      <p className="mv-feat-desc">{featured.description}</p>
                      <p className="mv-review-label">My Thoughts</p>
                      <p className="mv-review-text">{featured.review}</p>
                      <StarDisplay rating={featured.rating} />
                    </div>
                    <RatingCircle rating={featured.rating} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All movies grid */}
          <div className="mv-section">
            <div className="mv-section-hdr">
              <div>
                <p className="mv-section-eyebrow">
                  Full Watchlist — Highest Rated First
                </p>
                <h2 className="mv-section-title">All Films I've Seen</h2>
              </div>
              <button
                className="mv-add-btn"
                onClick={() => setShowLogModal(true)}
              >
                <PenLine size={16} /> Log a Movie
              </button>
            </div>
            {rest.length === 0 ? (
              <div className="mv-empty">
                <div className="mv-empty-icon">
                  <BookOpen />
                </div>
                <h3>No more films yet</h3>
                <p>Log another movie you have watched.</p>
              </div>
            ) : (
              <div className="mv-grid">
                {rest.map((movie) => (
                  <article key={movie.id} className="mv-card">
                    <div className="mv-card-cover-wrap">
                      <MoviePoster
                        title={movie.title}
                        director={movie.director}
                        palette={movie.palette}
                        image={movie.image}
                        className="mv-card-poster"
                      />
                      <div className="mv-card-rating-badge">
                        {"★".repeat(movie.rating)}
                        {"☆".repeat(5 - movie.rating)}
                      </div>
                    </div>
                    <div className="mv-card-body">
                      <div className="mv-card-top-row">
                        <span className="mv-card-date">
                          <Calendar size={11} /> {formatDate(movie.dateWatched)}
                        </span>
                        {isNew(movie.dateWatched) && (
                          <span
                            className="mv-new-tag"
                            style={{ fontSize: "0.55rem" }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <h3 className="mv-card-title">{movie.title}</h3>
                      <div className="mv-card-dir">
                        <Film size={11} /> Dir. {movie.director}
                      </div>
                      <div className="mv-card-chips">
                        {movie.year && (
                          <span className="mv-chip">{movie.year}</span>
                        )}
                        {movie.duration && (
                          <span className="mv-chip">{movie.duration}</span>
                        )}
                        {movie.language && (
                          <span className="mv-chip">{movie.language}</span>
                        )}
                      </div>
                      {movie.description && (
                        <p className="mv-card-desc">{movie.description}</p>
                      )}
                      {movie.review && (
                        <>
                          <p className="mv-card-review-label">My Thoughts</p>
                          <p className="mv-card-review">{movie.review}</p>
                        </>
                      )}
                      <StarDisplay rating={movie.rating} size="small" />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Wishlist tab */
        <div className="mv-section">
          <div className="mv-section-hdr">
            <div>
              <p className="mv-section-eyebrow">Films I Want to Watch Next</p>
              <h2 className="mv-section-title">My Movie Wishlist</h2>
            </div>
            <button
              className="mv-add-btn mv-wl-add-btn"
              onClick={() => setShowWishlistModal(true)}
            >
              <Bookmark size={16} /> Add to Wishlist
            </button>
          </div>
          {wishlist.length === 0 ? (
            <div className="mv-empty">
              <div className="mv-empty-icon">
                <Bookmark />
              </div>
              <h3>Your wishlist is empty</h3>
              <p>Add films you want to watch next.</p>
              <button
                className="mv-hero-cta"
                style={{ marginTop: "1rem" }}
                onClick={() => setShowWishlistModal(true)}
              >
                <Bookmark size={15} /> Add a Film
              </button>
            </div>
          ) : (
            <div className="mv-wishlist-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="mv-wishlist-card">
                  <div className="mv-wl-poster-wrap">
                    <MoviePoster
                      title={item.title}
                      director={item.director || "—"}
                      palette={item.palette}
                      image={item.image}
                      className="mv-card-poster"
                    />
                    <span className="mv-wl-badge">
                      <Bookmark size={11} /> Wishlist
                    </span>
                    {item.year && (
                      <span className="mv-wl-year">{item.year}</span>
                    )}
                  </div>
                  <div className="mv-wl-body">
                    <span className="mv-genre-tag">{item.genre}</span>
                    <h3 className="mv-wl-title">{item.title}</h3>
                    {item.director && (
                      <div className="mv-card-dir">
                        <Film size={11} /> Dir. {item.director}
                      </div>
                    )}
                    {item.notes && (
                      <p className="mv-wl-notes">"{item.notes}"</p>
                    )}
                    <div className="mv-wl-actions">
                      <button
                        className="mv-wl-watch-btn"
                        onClick={() => {
                          setMarkingAsWatched(item);
                          setShowLogModal(true);
                        }}
                      >
                        <CheckCheck size={14} /> Mark as Watched
                      </button>
                      <button
                        className="mv-wl-remove-btn"
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

      <Footer />

      {showLogModal && (
        <LogMovieModal
          onClose={() => {
            setShowLogModal(false);
            setMarkingAsWatched(null);
          }}
          onAdd={markingAsWatched ? handleMarkAsWatched : addMovie}
          prefill={markingAsWatched}
        />
      )}
      {showWishlistModal && (
        <WishlistMovieModal
          onClose={() => setShowWishlistModal(false)}
          onAdd={addToWishlist}
        />
      )}
    </div>
  );
}
