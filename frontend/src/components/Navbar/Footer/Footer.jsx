import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, BookOpen, PenLine, Timer, Camera, Library, Film, Mail, MapPin } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth.jsx'
import './Footer.css'

const SECTIONS = [
  { path: '/journal',  label: 'Journal',  icon: PenLine  },
  { path: '/books',    label: 'Books',    icon: Library  },
  { path: '/movies',   label: 'Movies',   icon: Film     },
  { path: '/memories', label: 'Memories', icon: Camera   },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer    },
]

const Footer = () => {
  const year = new Date().getFullYear()
  const { user } = useAuth()
  const displayName = user?.firstName || user?.username || 'My'
  const siteName = `${displayName}'s Space`
  const fullName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username
    : displayName

  return (
    <footer className="ft-root">
      <div className="ft-inner">

        {/* Brand */}
        <div className="ft-brand">
          <Link to="/" className="ft-logo">
            <div className="ft-logo-icon"><BookOpen size={20} color="#fff" /></div>
            <span className="ft-logo-name">{siteName}</span>
          </Link>
          <p className="ft-tagline">
            A personal digital space for journaling, reading, watching, and remembering.
            Built for me, by me — in Nepal.
          </p>
          <div className="ft-contact">
            <a href={`mailto:${user?.email || ''}`} className="ft-contact-link">
              <Mail size={14} /> {user?.email || ''}
            </a>
            <span className="ft-contact-link">
              <MapPin size={14} /> Kathmandu, Nepal
            </span>
          </div>
        </div>

        {/* Quick links */}
        <div className="ft-links-col">
          <p className="ft-col-title">My Space</p>
          <ul className="ft-links">
            {SECTIONS.map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <Link to={path} className="ft-link">
                  <Icon size={13} /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Site links */}
        <div className="ft-links-col">
          <p className="ft-col-title">Site</p>
          <ul className="ft-links">
            <li><Link to="/"        className="ft-link">Home</Link></li>
            <li><Link to="/about"   className="ft-link">About</Link></li>
            <li><Link to="/contact" className="ft-link">Contact</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="ft-bottom">
        <p className="ft-copy">
          Made with <Heart size={13} className="ft-heart" /> in Nepal &nbsp;·&nbsp; &copy; {year} {fullName}
        </p>
      </div>
    </footer>
  )
}

export default Footer
