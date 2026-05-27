import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Navbar/Footer/Footer'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import './Home.css'

const FEATURES = [
  {
    emoji: '🌿',
    key: 'journal',
    tag: 'Journal',
    title: 'Daily Journal',
    path: '/journal',
    desc: 'Write, reflect, and revisit your thoughts. A quiet space to keep a record of your days — moods, ideas, and everything in between.',
    cta: 'Open Journal',
  },
  {
    emoji: '🌱',
    key: 'pomodoro',
    tag: 'Focus',
    title: 'Focus Garden',
    path: '/pomodoro',
    desc: 'Stay focused with the Pomodoro technique. Work in structured sprints, take intentional breaks, and grow your virtual garden.',
    cta: 'Start Focusing',
  },
  {
    emoji: '📖',
    key: 'books',
    tag: 'Books',
    title: 'Book Shelf',
    path: '/books',
    desc: 'Log every book you read. Record your rating, personal review, and build a wishlist of books waiting to be discovered.',
    cta: 'Browse Books',
  },
  {
    emoji: '🌸',
    key: 'memories',
    tag: 'Memories',
    title: 'Memory Gallery',
    path: '/memories',
    desc: 'A visual gallery for the moments that matter. Upload photos, add captions, and keep your favourite memories in one place.',
    cta: 'View Gallery',
  },
  {
    emoji: '🎬',
    key: 'movies',
    tag: 'Movies',
    title: 'Movie Log',
    path: '/movies',
    desc: 'Track every film you watch. Leave your own review, add to your watchlist, and build your personal Ghibli-style cinema archive.',
    cta: 'Browse Films',
  },
]

export default function Home() {
  const { user } = useAuth()
  const displayName = user?.firstName || user?.username || 'My'
  const siteName = `${displayName}'s Space`

  return (
    <div className="home-root">
      <Navbar />

      {/* ── Hero — Ghibli illustrated landscape ── */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="home-hero-badge">
            <Sparkles size={13} />
            {displayName}'s Personal Space
          </span>

          <h1 className="home-hero-title">
            Welcome to<br />
            <em>{siteName}</em>
          </h1>

          <p className="home-hero-sub">
            Write in your journal, focus with Pomodoro, explore books and films, and preserve your favourite memories — all in one cozy corner of the internet.
          </p>

          <div className="home-hero-btns">
            <Link to="/journal" className="home-btn-primary">
              Open Journal <ArrowRight size={16} />
            </Link>
            <Link to="/books" className="home-btn-ghost">
              Browse Books
            </Link>
          </div>
        </div>
      </section>

      {/* ── SVG grass wave divider ── */}
      <div className="home-grass-divider">
        <svg viewBox="0 0 1200 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,48 L0,28 Q30,8 60,22 Q90,36 120,18 Q150,0 180,16 Q210,32 240,14 Q270,-4 300,18 Q330,40 360,20 Q390,0 420,18 Q450,36 480,16 Q510,-4 540,20 Q570,44 600,22 Q630,0 660,18 Q690,36 720,14 Q750,-8 780,16 Q810,40 840,20 Q870,0 900,18 Q930,36 960,16 Q990,-4 1020,18 Q1050,40 1080,22 Q1110,4 1140,20 Q1170,36 1200,18 L1200,48 Z"
            fill="#f5f0e8"
          />
        </svg>
      </div>

      {/* ── Feature cards ── */}
      <section className="home-features">
        <p className="home-section-label">✦ Your Corner ✦</p>
        <h2 className="home-section-title">Everything in One Place</h2>
        <p className="home-section-desc">
          Five sections, each built around a different part of daily life — like chapters in your favourite book.
        </p>

        <div className="home-cards-grid">
          {FEATURES.map(({ emoji, key, tag, title, path, desc, cta }) => (
            <Link key={path} to={path} className="home-card">
              <div className={`home-card-icon-wrap ${key}`}>{emoji}</div>
              <p className="home-card-tag">{tag}</p>
              <h3 className="home-card-title">{title}</h3>
              <p className="home-card-desc">{desc}</p>
              <span className="home-card-cta">
                {cta} <ArrowRight size={13} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ghibli quote strip ── */}
      <section className="home-quote-strip">
        <span className="home-quote-leaf">🍃</span>
        <p className="home-quote-text">
          "I think we ought to live happily ever after."
        </p>
        <p className="home-quote-author">— Howl's Moving Castle</p>
      </section>

      {/* ── Quick nav — wind-chime charm tags ── */}
      <section className="home-quicknav">
        <p className="home-section-label" style={{ marginBottom: 8 }}>✦ Quick Paths ✦</p>
        <h2 className="home-section-title" style={{ marginBottom: 6 }}>Where Would You Like to Go?</h2>
        <p className="home-section-desc" style={{ marginBottom: 44 }}>
          Jump straight to any section, like picking a charm off a wind chime.
        </p>

        <div className="home-charm-grid">
          {FEATURES.map(({ emoji, key, title, path }) => (
            <Link key={path} to={path} className="home-charm">
              <div className={`home-charm-bead ${key}`}>{emoji}</div>
              <span className="home-charm-tag">{title}</span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
