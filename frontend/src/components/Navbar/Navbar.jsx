import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Leaf, Home, PenLine, Timer, BookOpen, Film, Camera,
  Search, Info, Mail, LogOut, Settings, User,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useSettings } from "../../contexts/SettingsContext";

const LINKS = [
  { to: "/", label: "Today", icon: Home, end: true },
  { to: "/journal", label: "Journal", icon: PenLine },
  { to: "/pomodoro", label: "Focus", icon: Timer },
  { to: "/books", label: "Books", icon: BookOpen },
  { to: "/movies", label: "Films", icon: Film },
  { to: "/memories", label: "Memories", icon: Camera },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { setPanelOpen } = useSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const initial = (user?.firstName || user?.username || "T").charAt(0).toUpperCase();

  const handleSignOut = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    clsx(
      "inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-[9px] text-sm transition-colors",
      isActive
        ? "bg-moss-t text-moss-d font-semibold"
        : "text-ink-2 font-medium hover:bg-sunk hover:text-ink"
    );

  return (
    <header className="app-topbar sticky top-0 z-20 border-b border-line">
      <div className="wrap flex items-center gap-6 flex-wrap py-2 min-h-[64px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-ink hover:text-ink">
          <span className="w-[34px] h-[34px] rounded-ctl bg-moss text-white flex items-center justify-center">
            <Leaf size={18} />
          </span>
          <span className="font-serif font-medium text-[19px]">Tayama's Space</span>
        </Link>

        {/* Sections */}
        <nav className="flex gap-0.5 flex-1 flex-wrap" aria-label="Sections">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setPanelOpen(true)}
            className="w-11 h-11 flex items-center justify-center rounded-ctl text-ink-2 hover:bg-sunk hover:text-ink transition-colors"
          >
            <Search size={18} />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 rounded-full bg-clay-t text-clay-ink flex items-center justify-center font-bold text-sm"
            >
              {initial}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-line rounded-card shadow-cover py-1.5 z-30">
                <MenuItem as={Link} to="/about" icon={Info} onClick={() => setMenuOpen(false)}>
                  About
                </MenuItem>
                <MenuItem as={Link} to="/contact" icon={Mail} onClick={() => setMenuOpen(false)}>
                  Contact
                </MenuItem>
                <MenuItem
                  as="button"
                  icon={Settings}
                  onClick={() => { setMenuOpen(false); setPanelOpen(true); }}
                >
                  Settings
                </MenuItem>
                <div className="my-1 border-t border-line" />
                {user ? (
                  <MenuItem as="button" icon={LogOut} onClick={handleSignOut}>
                    Sign out
                  </MenuItem>
                ) : (
                  <MenuItem as={Link} to="/login" icon={User} onClick={() => setMenuOpen(false)}>
                    Sign in
                  </MenuItem>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({ as: Comp = "button", icon: Icon, children, className, ...rest }) {
  return (
    <Comp
      className={clsx(
        "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink-2 hover:bg-sunk hover:text-ink text-left transition-colors",
        className
      )}
      {...rest}
    >
      {Icon ? <Icon size={15} /> : null}
      {children}
    </Comp>
  );
}
