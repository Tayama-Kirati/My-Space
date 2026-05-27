import React, { useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, X, Home, BookOpen, Info, MessageSquare,
  PenLine, Timer, Camera, Library, Film,
  LayoutDashboard, LogOut, User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.jsx'
import './Navbar.css'

const TOP_LINKS = [
  { path: '/',        label: 'Home',    icon: Home },
  { path: '/about',   label: 'About',   icon: Info },
  { path: '/contact', label: 'Contact', icon: MessageSquare },
]

const SIDEBAR_LINKS = [
  { path: '/journal',  label: 'Journal',  icon: PenLine,  dot: 'dot-journal' },
  { path: '/pomodoro', label: 'Pomodoro', icon: Timer,    dot: 'dot-pomodoro' },
  { path: '/memories', label: 'Memories', icon: Camera,   dot: 'dot-memories' },
  { path: '/books',    label: 'Books',    icon: Library,  dot: 'dot-books' },
  { path: '/movies',   label: 'Movies',   icon: Film,     dot: 'dot-movies' },
]

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const displayName = user?.firstName || user?.username || 'My'
  const siteName = `${displayName}'s Space`

  const isActive = (path) => location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path))

  const closeSidebar = () => setSidebarOpen(false)

  const handleLogout = () => setConfirmOpen(true)

  const confirmLogout = () => {
    setConfirmOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* ── Top navbar ── */}
      <header className="sticky top-0 z-50 shadow-sm border-b-2" style={{ background: '#fdfcf8', borderColor: '#d4c5a9' }}>
        <div className="container-fluid py-0">
          <nav className="flex justify-between items-center h-16">

            {/* Left: sidebar toggle + logo */}
            <div className="flex items-center gap-3">
              <button
                className="nb-toggle"
                onClick={() => setSidebarOpen(true)}
                title="Open menu"
                aria-label="Open sidebar"
              >
                <Menu size={22} />
              </button>

              <Link to="/" className="group flex items-center gap-2">
                <div className="rounded-lg p-2 group-hover:shadow-lg transition-shadow" style={{ background: 'linear-gradient(135deg, #6aab55, #3d6632)' }}>
                  <BookOpen className="text-white" size={22} />
                </div>
                <h1 className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#2a1f15' }}>
                  {displayName}
                </h1>
              </Link>
            </div>

            {/* Centre: Home / About / Contact (desktop) */}
            <div className="hidden md:flex items-center gap-7">
              {TOP_LINKS.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 ${
                    isActive(path) ? 'border-b-2 pb-0.5' : 'hover:opacity-80'
                  }`}
                  style={isActive(path)
                    ? { color: '#4e7e40', borderColor: '#4e7e40' }
                    : { color: '#5a4a35' }}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Right: user info + logout */}
            <div className="flex items-center gap-2">
              {user && (
                <>
                  <span className="hidden md:flex items-center gap-1.5 text-sm font-medium" style={{ color: '#5a4a35' }}>
                    <User size={14} /> {displayName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="nb-auth-link hidden md:inline-flex items-center gap-1.5 text-sm"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </>
              )}
              <button
                onClick={() => setMobileOpen(o => !o)}
                className="nb-toggle md:hidden"
                aria-label="Mobile menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </nav>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="mobile-menu md:hidden">
              <div className="container-fluid py-3 flex flex-col gap-1">
                {TOP_LINKS.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={isActive(path)
                      ? { background: '#e8f5e2', color: '#4e7e40' }
                      : { color: '#5a4a35' }}
                    onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.background = '#ede8de' }}
                    onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.background = '' }}
                  >
                    <Icon size={18} /> {label}
                  </Link>
                ))}
                <button
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full text-left mt-1"
                  onClick={() => { setMobileOpen(false); setSidebarOpen(true) }}
                >
                  <LayoutDashboard size={18} /> Open Sidebar
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}

      {/* ── Sidebar drawer ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Sidebar header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" onClick={closeSidebar}>
            <div className="sidebar-logo-icon">
              <BookOpen size={18} color="#fff" />
            </div>
            <span className="sidebar-logo-text">{siteName}</span>
          </Link>
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Sidebar links */}
        <div className="sidebar-body">
          <p className="sidebar-section-label">My Space</p>

          {SIDEBAR_LINKS.map(({ path, label, icon: Icon, dot }) => (
            <Link
              key={path}
              to={path}
              onClick={closeSidebar}
              className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon size={18} className="sidebar-link-icon" />
              {label}
              <span className={`sidebar-dot ${dot}`} />
            </Link>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0.75rem 0.6rem' }} />

          <p className="sidebar-section-label">Site</p>
          {TOP_LINKS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={closeSidebar}
              className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
            >
              <Icon size={18} className="sidebar-link-icon" />
              {label}
            </Link>
          ))}
        </div>

        {/* Sidebar footer — logout */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-auth-row">
              <span className="text-xs text-white/60 flex items-center gap-1.5 px-1">
                <User size={13} /> {displayName}
              </span>
              <button
                onClick={() => { closeSidebar(); handleLogout() }}
                className="sidebar-login-btn w-full justify-center mt-2"
              >
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>
      {/* ── Logout confirmation dialog ── */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-xs w-full mx-4 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">👋</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Leaving so soon?
            </h2>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Stay
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                style={{ background: '#4e7e40' }}
              >
                Yes, logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
