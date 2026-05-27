import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "./Login.css";

const SLIDES = [
  {
    scene: "scene-spring",
    quote: '"Not all those who wander are lost."',
    author: "— J.R.R. Tolkien",
  },
  {
    scene: "scene-sunset",
    quote:
      '"The world is a book, and those who do not travel read only one page."',
    author: "— Saint Augustine",
  },
  {
    scene: "scene-night",
    quote:
      '"You can never get a cup of tea large enough or a book long enough to suit me."',
    author: "— C.S. Lewis",
  },
  {
    scene: "scene-forest",
    quote: '"A reader lives a thousand lives before he dies."',
    author: "— George R.R. Martin",
  },
];

const Login = ({ defaultTab = "login" }) => {
  const [tab, setTab] = useState(defaultTab);
  const [slideIdx, setSlideIdx] = useState(0);
  const [fadingIn, setFadingIn] = useState(true);

  // login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // signup fields
  const [name, setName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [showSuPass, setShowSuPass] = useState(false);
  const [showSuConfirm, setShowSuConfirm] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Cycle slides every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setFadingIn(false);
      setTimeout(() => {
        setSlideIdx((i) => (i + 1) % SLIDES.length);
        setFadingIn(true);
      }, 300);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Invalid email or password.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (suPassword !== suConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const [firstName, ...rest] = name.trim().split(" ");
    const lastName = rest.join(" ");
    const username = name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString().slice(-4);
    const result = await register({ email: suEmail, username, password: suPassword, firstName, lastName });
    setLoading(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.error || "Registration failed.");
    }
  };

  const slide = SLIDES[slideIdx];

  return (
    <div className="auth-root">
      {/* ── Left: image / slide panel ── */}
      <div
        className={`auth-slide-panel ${slide.scene} ${fadingIn ? "slide-visible" : "slide-hidden"}`}
      >
        {/* decorative circles */}
        <div className="slide-circle slide-circle-1" />
        <div className="slide-circle slide-circle-2" />
        <div className="slide-circle slide-circle-3" />

        {/* brand watermark */}
        <div className="slide-brand">
          <div className="slide-brand-icon">
            <BookOpen size={22} color="#fff" />
          </div>
          <span className="slide-brand-name">My Space</span>
        </div>

        {/* quote */}
        <div className="slide-quote-wrap">
          <blockquote className="slide-quote">{slide.quote}</blockquote>
          <cite className="slide-author">{slide.author}</cite>
        </div>

        {/* slide dots */}
        <div className="slide-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`slide-dot ${i === slideIdx ? "slide-dot-active" : ""}`}
              onClick={() => setSlideIdx(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Tab toggle */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === "login" ? "auth-tab-active" : ""}`}
              onClick={() => {
                setTab("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${tab === "signup" ? "auth-tab-active" : ""}`}
              onClick={() => {
                setTab("signup");
                setError("");
              }}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? (
            <>
              <h2 className="auth-heading">Welcome back</h2>
              <p className="auth-sub">Sign in to your personal space</p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-icon" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input auth-input-pr"
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit"
                >
                  {loading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <p className="auth-switch">
                Don't have an account?{" "}
                <button
                  className="auth-switch-link"
                  onClick={() => {
                    setTab("signup");
                    setError("");
                  }}
                >
                  Sign Up
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="auth-heading">Create account</h2>
              <p className="auth-sub">Create your personal space</p>

              {error && (
                <div className="auth-error">
                  <AlertCircle size={16} /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignup} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-icon" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-icon" />
                    <input
                      type="email"
                      required
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-icon" />
                    <input
                      type={showSuPass ? "text" : "password"}
                      required
                      value={suPassword}
                      onChange={(e) => setSuPassword(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input auth-input-pr"
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowSuPass((v) => !v)}
                    >
                      {showSuPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-icon" />
                    <input
                      type={showSuConfirm ? "text" : "password"}
                      required
                      value={suConfirm}
                      onChange={(e) => setSuConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="auth-input auth-input-pr"
                    />
                    <button
                      type="button"
                      className="auth-eye"
                      onClick={() => setShowSuConfirm((v) => !v)}
                    >
                      {showSuConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit"
                >
                  {loading ? "Creating…" : "Create Account"}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account?{" "}
                <button
                  className="auth-switch-link"
                  onClick={() => {
                    setTab("login");
                    setError("");
                  }}
                >
                  Login
                </button>
              </p>
            </>
          )}

          <p className="auth-back">
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
