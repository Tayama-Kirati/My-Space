import React from 'react'
import { Link } from 'react-router-dom'
import './About.css'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Navbar/Footer/Footer'
import { PenLine, Timer, Library, GalleryThumbnails, Film, Mail, ArrowRight } from 'lucide-react'

const SECTIONS = [
  { emoji: '🌿', icon: PenLine, title: 'Journal',      path: '/journal',  desc: 'Your private writing space for daily reflections, ideas, and personal notes — date-stamped and always yours.' },
  { emoji: '🌱', icon: Timer,   title: 'Focus Garden',  path: '/pomodoro', desc: 'A Pomodoro timer with a focus garden that grows with every session you complete. Work in sprints, earn plants.' },
  { emoji: '📖', icon: Library, title: 'Book Shelf',    path: '/books',    desc: 'Your reading log with cover art, personal reviews, star ratings, and a wishlist for books you want to read.' },
  { emoji: '🌸', icon: GalleryThumbnails, title: 'Memories', path: '/memories', desc: 'A photo gallery to save the moments that matter to you — trips, people, and everyday things worth keeping.' },
  { emoji: '🎬', icon: Film,    title: 'Movie Log',     path: '/movies',   desc: 'Track every film you watch. Reviews, ratings, a watchlist, and a Ghibli-inspired archive of your cinema memories.' },
]

const INTERESTS = [
  { emoji: '📚', label: 'Reading'    },
  { emoji: '💻', label: 'Coding'     },
  { emoji: '☕', label: 'Tea & Coffee' },
  { emoji: '✍️', label: 'Journaling'  },
  { emoji: '🌿', label: 'Nature'      },
  { emoji: '🎬', label: 'Ghibli Films' },
]

const TECH = ['React 19', 'Vite 6', 'Tailwind CSS 3', 'React Router 7', 'Lucide Icons', 'LocalStorage']

export default function About() {
  return (
    <div className="about-root">
      <Navbar />

      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-content">
          <div className="about-hero-avatar">🌿</div>
          <h1 className="about-hero-title">Hi, I'm Tayama</h1>
          <p className="about-hero-sub">
            I built this space so you can keep your thoughts, reading log, focus sessions, and favourite memories in one place — all yours, all private, all Ghibli-themed.
          </p>
        </div>
      </section>

      {/* ── About me ── */}
      <section className="about-section white">
        <div className="about-inner">
          <div className="about-two-col">
            <div>
              <span className="about-label">✦ About Me ✦</span>
              <h2 className="about-h2">Why I Built This</h2>
              <div className="about-desc" style={{ marginTop: 16 }}>
                <p>I'm a developer based in Nepal who wanted to build something genuinely useful — not just another productivity app, but a cosy corner of the internet where people can actually feel at home.</p>
                <p>This site gives you a single place to write your journal each day, log the books you read with honest ratings, use the Pomodoro timer when you need to focus, and keep a gallery of moments you want to remember.</p>
                <p>Built with React and styled with a Ghibli-inspired watercolour palette — because tools you use every day should feel warm and personal, not like a SaaS dashboard.</p>
              </div>
            </div>

            <div className="about-interests-box">
              <span className="about-label">✦ Things I Enjoy ✦</span>
              <div className="about-interests-grid">
                {INTERESTS.map(({ emoji, label }) => (
                  <div key={label} className="about-interest-card">
                    <span className="about-interest-emoji">{emoji}</span>
                    <span className="about-interest-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What's inside ── */}
      <section className="about-section cream">
        <div className="about-inner">
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span className="about-label">✦ The Site ✦</span>
            <h2 className="about-h2">What's Inside</h2>
            <p className="about-desc" style={{ maxWidth: 480, margin: '0 auto' }}>Five sections, each solving a different part of your daily life.</p>
          </div>
          <div className="about-cards-grid">
            {SECTIONS.map(({ emoji, title, path, desc }) => (
              <Link key={path} to={path} className="about-card">
                <div className="about-card-icon">{emoji}</div>
                <div>
                  <p className="about-card-title">{title}</p>
                  <p className="about-card-desc">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built with ── */}
      <section className="about-section white">
        <div className="about-inner-sm">
          <span className="about-label">✦ Stack ✦</span>
          <h2 className="about-h2">How It's Built</h2>
          <p className="about-desc">
            A simple, fast React + Vite setup styled with Tailwind CSS. Your data stays in your browser's localStorage — no accounts needed, offline-capable, and completely private.
          </p>
          <div className="about-tech-pills">
            {TECH.map(t => <span key={t} className="about-tech-pill">{t}</span>)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-section dark" style={{ textAlign: 'center' }}>
        <span className="about-cta-label">✦ Nepal ✦</span>
        <h2 className="about-cta-title">Made with care in Kathmandu, for you</h2>
        <p className="about-cta-sub">Have a suggestion, found a bug, or just want to say hello?</p>
        <Link to="/contact" className="about-cta-btn">
          <Mail size={16} /> Get in Touch <ArrowRight size={14} />
        </Link>
      </section>

      <Footer />
    </div>
  )
}
