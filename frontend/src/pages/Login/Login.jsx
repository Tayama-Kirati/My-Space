import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, AlertCircle, Camera, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui";

const SLIDES = [
  { quote: "“Not all those who wander are lost.”", author: "— J.R.R. Tolkien" },
  { quote: "“The world is a book, and those who do not travel read only one page.”", author: "— Saint Augustine" },
  { quote: "“You can never get a cup of tea large enough or a book long enough to suit me.”", author: "— C.S. Lewis" },
  { quote: "“A reader lives a thousand lives before he dies.”", author: "— George R.R. Martin" },
];

export default function Login({ defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);
  const [slideIdx, setSlideIdx] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [showSuPass, setShowSuPass] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loginBg, setLoginBg] = useState(() => localStorage.getItem("login_bg") || null);
  const bgInputRef = useRef();

  const { login, register, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate("/", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const id = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setSlideIdx((i) => (i + 1) % SLIDES.length);
        setFadeIn(true);
      }, 300);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLoginBg(ev.target.result);
      localStorage.setItem("login_bg", ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

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
    if (result.success) navigate("/", { replace: true });
    else setError(result.error || "Invalid email or password.");
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
    const username =
      name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString().slice(-4);
    const result = await register({ email: suEmail, username, password: suPassword, firstName, lastName });
    setLoading(false);
    if (result.success) navigate("/", { replace: true });
    else setError(result.error || "Registration failed.");
  };

  const slide = SLIDES[slideIdx];
  const isLogin = tab === "login";

  return (
    <div className="min-h-screen flex flex-wrap bg-bg">
      {/* Art panel */}
      <aside
        className="relative overflow-hidden flex flex-col justify-between p-10 min-h-[420px]"
        style={{ flex: "1 1 520px", background: "#DCE8EF" }}
      >
        {loginBg && (
          <>
            <img src={loginBg} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
            <div
              className="absolute inset-0 z-[1]"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,.6), rgba(0,0,0,.15))" }}
            />
          </>
        )}
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="w-[34px] h-[34px] rounded-ctl bg-moss text-white flex items-center justify-center">
            <Leaf size={18} />
          </span>
          <span className="font-serif font-medium text-[19px]" style={{ color: loginBg ? "#fff" : "var(--c-ink)" }}>
            Tayama's Space
          </span>
        </div>

        {!loginBg && (
          <>
            <div
              aria-hidden
              className="absolute rounded-full"
              style={{ top: "18%", right: "14%", width: 84, height: 84, background: "#F4E3B5" }}
            />
            <svg
              viewBox="0 0 800 360"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute left-0 right-0 bottom-0 w-full"
              style={{ height: "60%" }}
            >
              <path d="M0 170 C 140 90 260 120 380 150 C 520 185 640 110 800 130 L800 360 L0 360 Z" fill="#B9D0B0" />
              <path d="M0 230 C 160 170 300 210 430 220 C 580 232 690 180 800 200 L800 360 L0 360 Z" fill="#8FB383" />
              <path d="M0 290 C 180 250 330 280 470 285 C 620 290 720 260 800 270 L800 360 L0 360 Z" fill="#5E8B55" />
            </svg>
          </>
        )}

        <figure
          className="relative z-10 m-0 max-w-[440px] transition-opacity duration-300"
          style={{ opacity: fadeIn ? 1 : 0 }}
        >
          <blockquote className="font-serif text-[30px] leading-[1.25] text-white m-0 drop-shadow">
            {slide.quote}
          </blockquote>
          <figcaption className="mt-3 text-sm" style={{ color: "#EEF4EA" }}>
            {slide.author}
          </figcaption>
        </figure>

        <div className="absolute bottom-3.5 right-3.5 z-20 flex gap-1.5">
          {loginBg && (
            <button
              onClick={() => { setLoginBg(null); localStorage.removeItem("login_bg"); }}
              aria-label="Remove photo"
              className="rounded-lg p-2 text-white"
              style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }}
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => bgInputRef.current.click()}
            className="rounded-lg px-3 py-1.5 text-white text-xs font-semibold flex items-center gap-1.5"
            style={{ background: "rgba(255,255,255,.2)", border: "1px solid rgba(255,255,255,.4)", backdropFilter: "blur(4px)" }}
          >
            <Camera size={13} /> {loginBg ? "Change" : "Photo"}
          </button>
          <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12 bg-bg" style={{ flex: "1 1 440px" }}>
        <div className="w-full max-w-[400px]">
          <h1 className="font-serif font-medium text-[32px] text-ink">
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-ink-2 mt-1.5">
            {isLogin ? "Sign in to your journal, shelf and focus garden." : "Start your personal space."}
          </p>

          {error && (
            <div className="mt-5 flex items-center gap-2 text-sm text-clay-ink bg-clay-t rounded-ctl px-3 py-2.5">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-[18px] mt-8">
              <Field label="Email" htmlFor="em">
                <input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email" placeholder="you@example.com" className="auth-ctl" />
              </Field>
              <Field label="Password" htmlFor="pw"
                aside={<button type="button" className="text-[13px] font-semibold text-moss">Forgot password?</button>}>
                <div className="relative">
                  <input id="pw" type={showPassword ? "text" : "password"} required value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="current-password"
                    placeholder="At least 8 characters" className="auth-ctl pr-12" />
                  <EyeButton shown={showPassword} onClick={() => setShowPassword((v) => !v)} />
                </div>
              </Field>
              <label className="flex items-center gap-2.5 text-sm text-ink-2">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                  className="w-[18px] h-[18px] accent-moss" /> Keep me signed in
              </label>
              <Button type="submit" disabled={loading} className="w-full min-h-[48px] text-[15px]">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-[18px] mt-8">
              <Field label="Full name" htmlFor="nm">
                <input id="nm" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="name" placeholder="Your name" className="auth-ctl" />
              </Field>
              <Field label="Email" htmlFor="sem">
                <input id="sem" type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)}
                  autoComplete="email" placeholder="you@example.com" className="auth-ctl" />
              </Field>
              <Field label="Password" htmlFor="spw">
                <div className="relative">
                  <input id="spw" type={showSuPass ? "text" : "password"} required value={suPassword}
                    onChange={(e) => setSuPassword(e.target.value)} placeholder="At least 8 characters" className="auth-ctl pr-12" />
                  <EyeButton shown={showSuPass} onClick={() => setShowSuPass((v) => !v)} />
                </div>
              </Field>
              <Field label="Confirm password" htmlFor="scf">
                <input id="scf" type="password" required value={suConfirm}
                  onChange={(e) => setSuConfirm(e.target.value)} placeholder="Repeat password" className="auth-ctl" />
              </Field>
              <Button type="submit" disabled={loading} className="w-full min-h-[48px] text-[15px]">
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>
          )}

          <p className="text-ink-2 mt-7 text-sm text-center">
            {isLogin ? "New here? " : "Already have an account? "}
            <button
              className="font-semibold text-moss"
              onClick={() => { setTab(isLogin ? "signup" : "login"); setError(""); }}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="text-center mt-4 text-[13px]">
            <Link to="/about" className="text-ink-3 hover:text-ink">About this space</Link>
          </p>
        </div>
      </section>

      {/* local control styling (reuses token-based input look) */}
      <style>{`
        .auth-ctl{height:44px;width:100%;padding:0 14px;border-radius:10px;border:1px solid var(--c-line);
          background:#fff;color:var(--c-ink);outline:none;}
        .auth-ctl:focus{border-color:var(--c-moss);box-shadow:0 0 0 3px rgba(62,107,57,.18);}
      `}</style>
    </div>
  );
}

function Field({ label, htmlFor, aside, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-baseline">
        <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink-2">{label}</label>
        {aside}
      </div>
      {children}
    </div>
  );
}

function EyeButton({ shown, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-0 top-0 w-11 h-11 flex items-center justify-center text-ink-2">
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}
