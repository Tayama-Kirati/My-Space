import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Navbar/Footer/Footer";
import {
  Play, Pause, RotateCcw, SkipForward,
  Leaf, Trophy, Flame, BarChart2,
  Camera, X, Flag,
} from "lucide-react";
import { useToast } from "../../components/Toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { readJSON, writeJSON } from "../../utils/authPersistence";

// ── Pomodoro limits (max 60 min = 1 clock revolution) ────────────────────
const FOCUS_MAX_SECS = 60 * 60;
const FOCUS_DEFAULT  = 25 * 60;
const SHORT_DEFAULT  =  5 * 60;
const LONG_DEFAULT   = 15 * 60;

// ── Analog clock SVG constants ────────────────────────────────────────────
const CLK_CX = 155, CLK_CY = 155;
const CLK_R  = 140;   // face outer radius
const CLK_ARC_R = 128; // arc ring radius
const CLK_HAND_R = 105; // hand length
const CLOCK_CIRC = 2 * Math.PI * CLK_ARC_R;

// Precomputed clock ticks (static, computed once)
const CLOCK_TICKS = Array.from({ length: 60 }, (_, i) => {
  const angle  = (i / 60) * 2 * Math.PI;
  const sin    = Math.sin(angle);
  const cos    = Math.cos(angle);
  const major  = i % 5 === 0;
  const rOuter = CLK_R - 2;
  const rInner = major ? CLK_R - 18 : CLK_R - 10;
  return {
    x1: CLK_CX + rInner * sin,  y1: CLK_CY - rInner * cos,
    x2: CLK_CX + rOuter * sin,  y2: CLK_CY - rOuter * cos,
    major,
  };
});

// Precomputed clock numbers (at 5-min positions)
const CLOCK_NUMS = Array.from({ length: 12 }, (_, i) => {
  const mins  = (i + 1) * 5;
  const angle = (mins / 60) * 2 * Math.PI;
  const r     = CLK_R - 30;
  return {
    x: CLK_CX + r * Math.sin(angle),
    y: CLK_CY - r * Math.cos(angle),
    label: String(mins),
  };
});

// ── Break ring SVG constants ──────────────────────────────────────────────
const BCX = 110, BCY = 110, BR = 88;
const BCIRC = 2 * Math.PI * BR;

// ── Countdown timer ring constants ────────────────────────────────────────
const TCX = 160, TCY = 160, TR = 130;
const TCIRC = 2 * Math.PI * TR;
const TIMER_MAX = 24 * 3600;

// ── Colors ────────────────────────────────────────────────────────────────
const FOCUS_COL = { ring: "#2e5aa8", bg: "from-primary-700 to-primary-500", soft: "#dbeafe" };
const SHORT_COL = { ring: "#16a34a", bg: "from-green-700 to-green-500",    soft: "#dcfce7" };
const LONG_COL  = { ring: "#0d9488", bg: "from-teal-700 to-teal-500",      soft: "#ccfbf1" };

// ── Plants ────────────────────────────────────────────────────────────────
const PLANTS = [
  { emoji:"🌱",name:"Sprout" },{ emoji:"🌸",name:"Cherry Blossom" },
  { emoji:"🌻",name:"Sunflower" },{ emoji:"🌹",name:"Rose" },
  { emoji:"🌷",name:"Tulip" },{ emoji:"🍀",name:"Clover" },
  { emoji:"🌿",name:"Herb" },{ emoji:"🎋",name:"Bamboo" },
  { emoji:"🌺",name:"Hibiscus" },{ emoji:"🪴",name:"Potted Plant" },
  { emoji:"🌳",name:"Oak Tree" },{ emoji:"🍄",name:"Mushroom" },
  { emoji:"🌼",name:"Daisy" },{ emoji:"🌾",name:"Wheat" },
  { emoji:"🌵",name:"Cactus" },{ emoji:"🎍",name:"Pine Deco" },
  { emoji:"🍎",name:"Apple" },{ emoji:"🍊",name:"Orange" },
  { emoji:"🍋",name:"Lemon" },{ emoji:"🍇",name:"Grapes" },
  { emoji:"🍓",name:"Strawberry" },{ emoji:"🫐",name:"Blueberry" },
  { emoji:"🍑",name:"Peach" },{ emoji:"🍒",name:"Cherry" },
  { emoji:"🍍",name:"Pineapple" },{ emoji:"🥝",name:"Kiwi" },
  { emoji:"🍉",name:"Watermelon" },{ emoji:"🫒",name:"Olive" },
  { emoji:"🍰",name:"Cake Slice" },{ emoji:"🧁",name:"Cupcake" },
  { emoji:"🍩",name:"Donut" },{ emoji:"🍪",name:"Cookie" },
  { emoji:"🍫",name:"Chocolate" },{ emoji:"🧇",name:"Waffle" },
  { emoji:"🍡",name:"Dango" },{ emoji:"🎂",name:"Birthday Cake" },
  { emoji:"🍮",name:"Pudding" },{ emoji:"🍜",name:"Ramen" },
  { emoji:"🍱",name:"Bento Box" },{ emoji:"🍙",name:"Rice Ball" },
  { emoji:"🥟",name:"Dumpling" },{ emoji:"🍣",name:"Sushi" },
  { emoji:"🍤",name:"Tempura" },{ emoji:"☕",name:"Coffee" },
  { emoji:"🍵",name:"Matcha Tea" },{ emoji:"🧋",name:"Bubble Tea" },
  { emoji:"🍶",name:"Sake" },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtTime = (s) =>
  `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const fmtMin  = (s) => `${Math.round(s/60)} min`;
const fmtSW   = (ms) => {
  const cs=Math.floor(ms/10)%100, s=Math.floor(ms/1000)%60,
        m=Math.floor(ms/60000)%60, h=Math.floor(ms/3600000);
  if(h>0)
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}.${String(cs).padStart(2,"0")}`;
};

function loadGarden()     { return readJSON("pomodoro_garden",[]); }
function saveGarden(g)    { writeJSON("pomodoro_garden",g); }
function loadStats()      { return readJSON("pomodoro_stats",{total:0,streak:0,lastDate:""}); }
function saveStats(s)     { writeJSON("pomodoro_stats",s); }
function loadClockEmoji() { return readJSON("pomodoro_clock_emoji","🍅"); }
function saveClockEmoji(e){ writeJSON("pomodoro_clock_emoji",e); }
function loadClockImage() { return readJSON("pomodoro_clock_image",null); }
function saveClockImage(d){ writeJSON("pomodoro_clock_image",d); }
function todayStr() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function shortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}
function playDone() {
  try {
    const ctx=new(window.AudioContext||window.webkitAudioContext)();
    [523,659,784,1047].forEach((freq,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.connect(g);g.connect(ctx.destination);
      o.frequency.value=freq;o.type="sine";
      g.gain.setValueAtTime(0.2,ctx.currentTime+i*0.15);
      g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.15+0.4);
      o.start(ctx.currentTime+i*0.15);o.stop(ctx.currentTime+i*0.15+0.5);
    });
  } catch{}
}

// Convert SVG coords to clock angle (0=12 o'clock, increases clockwise)
function svgToClockAngle(svgX, svgY) {
  const dx = svgX - CLK_CX, dy = svgY - CLK_CY;
  let a = Math.atan2(dx, -dy);
  if (a < 0) a += 2 * Math.PI;
  return a;
}
// Convert seconds (0-3600) to clock angle
function secsToAngle(secs) {
  return (secs / FOCUS_MAX_SECS) * 2 * Math.PI;
}
// Clock angle to hand tip position
function angleToPos(angle, r=CLK_HAND_R) {
  return { x: CLK_CX + r * Math.sin(angle), y: CLK_CY - r * Math.cos(angle) };
}
// SVG arc path for sector (center-fill wedge showing time left, from 12 o'clock clockwise)
function sectorPath(secs) {
  const frac = secs / FOCUS_MAX_SECS;
  if (frac <= 0) return "";
  if (frac >= 1) return `M ${CLK_CX} ${CLK_CY-CLK_ARC_R} a ${CLK_ARC_R} ${CLK_ARC_R} 0 1 1 -0.001 0 Z`;
  const a = frac * 2 * Math.PI;
  const ex = CLK_CX + CLK_ARC_R * Math.sin(a);
  const ey = CLK_CY - CLK_ARC_R * Math.cos(a);
  return `M ${CLK_CX} ${CLK_CY} L ${CLK_CX} ${CLK_CY-CLK_ARC_R} A ${CLK_ARC_R} ${CLK_ARC_R} 0 ${a>Math.PI?1:0} 1 ${ex} ${ey} Z`;
}

// pointToAngle for countdown timer ring drag
function pointToAngle(x,y,cx,cy){
  let a=Math.atan2(y-cy,x-cx)+Math.PI/2;
  if(a<0)a+=2*Math.PI;
  return a;
}

// ── Chart helpers ─────────────────────────────────────────────────────────
function getDateStr(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function getDailyData(garden,days=7){
  const result=[];
  for(let i=days-1;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=getDateStr(d);
    result.push({label:i===0?"Today":d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),sessions:garden.filter(p=>p.plantedAt.startsWith(ds)).length,isToday:i===0});
  }
  return result;
}
function getWeeklyData(garden,weeks=6){
  const result=[];
  for(let i=weeks-1;i>=0;i--){
    const end=new Date();end.setDate(end.getDate()-i*7);
    const start=new Date(end);start.setDate(start.getDate()-6);
    result.push({label:i===0?"This week":start.toLocaleDateString("en-US",{month:"short",day:"numeric"}),sessions:garden.filter(p=>{const d=new Date(p.plantedAt);return d>=start&&d<=end;}).length,isToday:i===0});
  }
  return result;
}
function getMonthlyData(garden,months=6){
  const result=[];
  for(let i=months-1;i>=0;i--){
    const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i);
    const year=d.getFullYear(), month=d.getMonth();
    result.push({
      label:i===0?"This month":d.toLocaleDateString("en-US",{month:"short",year:"2-digit"}),
      sessions:garden.filter(p=>{const pd=new Date(p.plantedAt);return pd.getFullYear()===year&&pd.getMonth()===month;}).length,
      isToday:i===0,
    });
  }
  return result;
}
function ChartTooltip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(<div style={{background:"#fdfcf8",border:"1.5px solid #d4c5a9",borderRadius:10,padding:"8px 14px",fontFamily:"Lora,serif"}}>
    <p style={{fontSize:"0.78rem",color:"#7a6a50",marginBottom:2}}>{label}</p>
    <p style={{fontSize:"1rem",fontWeight:700,color:"#4e7e40"}}>{payload[0].value} session{payload[0].value!==1?"s":""}</p>
  </div>);
}

// ── Tabs ──────────────────────────────────────────────────────────────────
const TABS = [
  { id:"pomodoro",  label:"Pomodoro",     icon:"🍅" },
  { id:"timer",     label:"Timer",        icon:"⏱" },
  { id:"stopwatch", label:"Stopwatch",    icon:"🕐" },
  { id:"garden",    label:"Focus Garden", icon:"🌿" },
];

// ── Main component ────────────────────────────────────────────────────────
export default function Pomodoro() {
  const [activeTab, setActiveTab] = useState("pomodoro");

  // ── Pomodoro state ──────────────────────────────────────────────────────
  const [focusLeft, setFocusLeft] = useState(FOCUS_DEFAULT);
  const [focusMax,  setFocusMax]  = useState(FOCUS_DEFAULT);
  const [breakLeft,   setBreakLeft]   = useState(SHORT_DEFAULT);
  const [breakMax,    setBreakMax]    = useState(SHORT_DEFAULT);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [isBreak,  setIsBreak]  = useState(false);
  const [running,  setRunning]  = useState(false);
  const [clkDragging, setClkDragging] = useState(false);
  const [cycleDone,  setCycleDone]  = useState(0);
  const [garden,     setGarden]     = useState(loadGarden);
  const [stats,      setStats]      = useState(loadStats);
  const [newPlantId, setNewPlantId] = useState(null);
  const [chartView,  setChartView]  = useState("days");
  const [clockEmoji,     setClockEmoji]     = useState(loadClockEmoji);
  const [clockImage,     setClockImage]     = useState(loadClockImage);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // ── Countdown timer state ───────────────────────────────────────────────
  const [tmH,    setTmH]    = useState(0);
  const [tmM,    setTmM]    = useState(5);
  const [tmS,    setTmS]    = useState(0);
  const [tmLeft, setTmLeft] = useState(5*60);
  const [tmMax,  setTmMax]  = useState(5*60);
  const [tmRun,  setTmRun]  = useState(false);
  const [tmDone, setTmDone] = useState(false);
  const [tmDrag, setTmDrag] = useState(false);

  // ── Stopwatch state ─────────────────────────────────────────────────────
  const [swMs,      setSwMs]     = useState(0);
  const [swRunning, setSwRunning]= useState(false);
  const [swLaps,    setSwLaps]   = useState([]);
  const [swLastLap, setSwLastLap]= useState(0);

  // ── Refs ────────────────────────────────────────────────────────────────
  const clkSvgRef     = useRef(null);
  const timerSvgRef   = useRef(null);
  const imageInputRef = useRef(null);
  const gardenRef     = useRef(null);
  const chartRef      = useRef(null);
  const pomInterval   = useRef(null);
  const tmInterval    = useRef(null);
  const swInterval    = useRef(null);
  const swStartRef    = useRef(null);
  const swOffsetRef   = useRef(0);
  const toast = useToast();

  const col = isBreak ? (isLongBreak ? LONG_COL : SHORT_COL) : FOCUS_COL;

  // ── Clock SVG coords ────────────────────────────────────────────────────
  const getClkSVGPos = useCallback((e) => {
    const svg = clkSvgRef.current; if (!svg) return { x: CLK_CX, y: CLK_CY };
    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * (310 / rect.width),
      y: (cy - rect.top)  * (310 / rect.height),
    };
  }, []);

  // ── Countdown timer SVG coords ──────────────────────────────────────────
  const getTmSVGPos = useCallback((e) => {
    const svg = timerSvgRef.current; if (!svg) return { x: TCX, y: TCY };
    const rect = svg.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * (320 / rect.width),
      y: (cy - rect.top)  * (320 / rect.height),
    };
  }, []);

  // ── plantNew ─────────────────────────────────────────────────────────────
  const plantNew = useCallback(() => {
    const p = {
      id: Date.now(),
      ...PLANTS[Math.floor(Math.random() * PLANTS.length)],
      plantedAt: new Date().toISOString(),
      session: stats.total + 1,
    };
    const updated = [p, ...garden];
    setGarden(updated); saveGarden(updated);
    setNewPlantId(p.id);
    setTimeout(() => setNewPlantId(null), 3000);
    const today = todayStr();
    const yesterday = (() => { const d=new Date();d.setDate(d.getDate()-1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
    const streak = stats.lastDate===today||stats.lastDate===yesterday ? stats.streak+1 : 1;
    const ns = { total: stats.total+1, streak, lastDate: today };
    setStats(ns); saveStats(ns);
  }, [garden, stats]);

  // ── Pomodoro tick ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    pomInterval.current = setInterval(() => {
      if (!isBreak) {
        setFocusLeft((t) => {
          if (t <= 1) {
            clearInterval(pomInterval.current);
            setRunning(false); playDone(); plantNew();
            const next=(cycleDone+1)%4; const long=next===0;
            setCycleDone(next); setIsLongBreak(long);
            const bt=long?LONG_DEFAULT:SHORT_DEFAULT;
            setBreakLeft(bt); setBreakMax(bt);
            setTimeout(()=>setIsBreak(true),600);
            return 0;
          }
          return t-1;
        });
      } else {
        setBreakLeft((t) => {
          if (t <= 1) {
            clearInterval(pomInterval.current);
            setRunning(false); playDone();
            setIsBreak(false); setFocusLeft(focusMax);
            return 0;
          }
          return t-1;
        });
      }
    }, 1000);
    return () => clearInterval(pomInterval.current);
  }, [running, isBreak, cycleDone, plantNew, focusMax]);

  // ── Countdown timer tick ─────────────────────────────────────────────────
  useEffect(() => {
    if (!tmRun) return;
    tmInterval.current = setInterval(() => {
      setTmLeft((t) => {
        if (t <= 1) {
          clearInterval(tmInterval.current);
          setTmRun(false); playDone(); setTmDone(true);
          setTimeout(()=>setTmDone(false),3000);
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(tmInterval.current);
  }, [tmRun]);

  // ── Stopwatch tick ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!swRunning) return;
    swStartRef.current = Date.now();
    swInterval.current = setInterval(() => {
      setSwMs(swOffsetRef.current + (Date.now() - swStartRef.current));
    }, 30);
    return () => clearInterval(swInterval.current);
  }, [swRunning]);

  // ── Clock drag ───────────────────────────────────────────────────────────
  const onClkDown = (e) => {
    if (running || isBreak) return;
    e.preventDefault(); setClkDragging(true);
  };
  const onClkMove = useCallback((e) => {
    if (!clkDragging || running) return;
    const { x, y } = getClkSVGPos(e);
    const angle = svgToClockAngle(x, y);
    const mins  = Math.max(1, Math.round((angle / (2 * Math.PI)) * 60));
    const secs  = mins * 60;
    setFocusMax(secs); setFocusLeft(secs);
  }, [clkDragging, running, getClkSVGPos]);
  const onClkUp = useCallback(() => setClkDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", onClkMove);
    window.addEventListener("mouseup",   onClkUp);
    window.addEventListener("touchmove", onClkMove, { passive:false });
    window.addEventListener("touchend",  onClkUp);
    return () => {
      window.removeEventListener("mousemove", onClkMove);
      window.removeEventListener("mouseup",   onClkUp);
      window.removeEventListener("touchmove", onClkMove);
      window.removeEventListener("touchend",  onClkUp);
    };
  }, [onClkMove, onClkUp]);

  // ── Countdown timer drag ─────────────────────────────────────────────────
  const onTmDown = (e) => { if(tmRun)return; e.preventDefault(); setTmDrag(true); };
  const onTmMove = useCallback((e) => {
    if (!tmDrag || tmRun) return;
    const {x,y} = getTmSVGPos(e);
    const angle  = pointToAngle(x,y,TCX,TCY);
    const secs   = Math.max(60, Math.round((angle/(2*Math.PI))*TIMER_MAX/60)*60);
    const h=Math.floor(secs/3600),m=Math.floor((secs%3600)/60),s=secs%60;
    setTmH(h);setTmM(m);setTmS(s);setTmMax(secs);setTmLeft(secs);
  }, [tmDrag, tmRun, getTmSVGPos]);
  const onTmUp = useCallback(() => setTmDrag(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", onTmMove);
    window.addEventListener("mouseup",   onTmUp);
    window.addEventListener("touchmove", onTmMove,{passive:false});
    window.addEventListener("touchend",  onTmUp);
    return () => {
      window.removeEventListener("mousemove", onTmMove);
      window.removeEventListener("mouseup",   onTmUp);
      window.removeEventListener("touchmove", onTmMove);
      window.removeEventListener("touchend",  onTmUp);
    };
  }, [onTmMove, onTmUp]);

  // ── Derived values ───────────────────────────────────────────────────────
  const focusAngle  = secsToAngle(focusLeft);
  const handPos     = angleToPos(focusAngle);
  const handTipPos  = angleToPos(focusAngle, CLK_HAND_R + 10); // for draggable handle

  const breakProgress = breakMax>0 ? breakLeft/breakMax : 0;
  const breakDash     = BCIRC * (1-breakProgress);

  const tmProgress  = tmMax>0 ? tmLeft/tmMax : 0;
  const tmDash      = TCIRC*(1-tmProgress);
  const tmHandleAng = tmProgress*2*Math.PI;
  const tmHandle    = {x:TCX+TR*Math.sin(tmHandleAng),y:TCY-TR*Math.cos(tmHandleAng)};

  const todayCount = garden.filter(p=>p.plantedAt.startsWith(todayStr())).length;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{setClockImage(ev.target.result);saveClockImage(ev.target.result);};
    reader.readAsDataURL(file); e.target.value="";
  };
  const handlePomReset = () => {
    clearInterval(pomInterval.current); setRunning(false);
    if(!isBreak) setFocusLeft(focusMax); else setBreakLeft(breakMax);
  };
  const handlePomSkip = () => {
    clearInterval(pomInterval.current); setRunning(false);
    if(!isBreak){
      plantNew();
      const next=(cycleDone+1)%4; const long=next===0;
      setCycleDone(next); setIsLongBreak(long);
      const bt=long?LONG_DEFAULT:SHORT_DEFAULT;
      setBreakLeft(bt);setBreakMax(bt);setIsBreak(true);setFocusLeft(focusMax);
    } else { setIsBreak(false);setFocusLeft(focusMax); }
  };
  const applyTimerInput = () => {
    const secs=tmH*3600+tmM*60+tmS; if(secs<1)return;
    setTmMax(secs);setTmLeft(secs);setTmDone(false);
  };
  const handleSwLap = () => {
    const lapTime=swMs-swLastLap;
    setSwLaps(prev=>[{id:prev.length+1,split:swMs,lap:lapTime},...prev]);
    setSwLastLap(swMs);
  };
  const handleSwReset = () => {
    clearInterval(swInterval.current);setSwRunning(false);
    swOffsetRef.current=0;setSwMs(0);setSwLaps([]);setSwLastLap(0);
  };
  const toggleSw = () => {
    if(swRunning){clearInterval(swInterval.current);swOffsetRef.current=swMs;}
    setSwRunning(r=>!r);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen" style={{background:"#f5f0e8"}}>
      <Navbar />

      {/* Hero + tabs */}
      <section className="relative overflow-hidden py-10 transition-all duration-700" style={{
        background:`radial-gradient(ellipse 220px 85px at 12% 22%,#fff 0%,transparent 70%),
          radial-gradient(ellipse 170px 65px at 76% 18%,#fffdf9 0%,transparent 70%),
          radial-gradient(ellipse 80% 26% at 50% 76%,#8cbd7e 0%,transparent 55%),
          radial-gradient(ellipse 52% 34% at 6% 88%,#4e9140 0%,transparent 55%),
          radial-gradient(ellipse 52% 34% at 94% 88%,#4e9140 0%,transparent 55%),
          linear-gradient(180deg,${col.ring}cc 0%,${col.ring}88 30%,#cceaf9 60%,#e5f8fe 78%,#f5f0e8 100%)`,
      }}>
        <div className="container-fluid text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4" style={{fontFamily:"Playfair Display,serif",color:"#1a3a12",textShadow:"0 2px 16px rgba(255,255,255,0.5)"}}>
            Focus Garden
          </h1>
          {/* Scrollable tab bar */}
          <div className="flex justify-center">
            <div
              className="flex gap-1 p-1.5 rounded-2xl shadow-lg"
              style={{background:"rgba(255,255,255,0.6)",backdropFilter:"blur(8px)",overflowX:"auto",maxWidth:"calc(100vw - 2rem)"}}
            >
              {TABS.map(tab=>(
                <button
                  key={tab.id}
                  onClick={()=>setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0"
                  style={activeTab===tab.id
                    ?{background:"#fff",color:"#1a3a12",boxShadow:"0 2px 8px rgba(0,0,0,0.12)",fontFamily:"Lora,serif"}
                    :{color:"#2a4a20",fontFamily:"Lora,serif"}}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="container-fluid py-10 flex-1 max-w-4xl mx-auto w-full">

        {/* ══════════════ POMODORO TAB ══════════════ */}
        {activeTab==="pomodoro" && (
          <div className="flex flex-col gap-6 items-center">
            <div className="rounded-3xl shadow-lg p-6 flex flex-col items-center w-full max-w-2xl" style={{background:"#fdfcf8",border:"1.5px solid #d4c5a9"}}>

              {/* Mode badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-500" style={{background:col.soft,color:col.ring,fontFamily:"Lora,serif"}}>
                  {isBreak?(isLongBreak?"🌸 Long Break":"☕ Short Break"):"Focus Time"}
                </span>
              </div>

              {/* Clock + break ring */}
              <div className="flex flex-row items-center justify-center gap-6 flex-wrap w-full">

                {/* ── Analog clock face ── */}
                <div className="flex flex-col items-center">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:isBreak?"#9ca3af":FOCUS_COL.ring,fontFamily:"Lora,serif"}}>
                    Focus
                  </p>

                  {!running && !isBreak && (
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary-400 inline-block animate-pulse"/>
                      Drag the hand to set time
                    </p>
                  )}

                  <svg
                    ref={clkSvgRef}
                    width="300" height="300"
                    viewBox="0 0 310 310"
                    className="select-none touch-none"
                    style={{cursor:running||isBreak?"default":clkDragging?"grabbing":"default"}}
                  >
                    {/* Clock face background */}
                    <circle cx={CLK_CX} cy={CLK_CY} r={CLK_R+6}
                      fill={isBreak?"#f3f4f6":FOCUS_COL.soft}
                      stroke={isBreak?"#e5e7eb":FOCUS_COL.ring}
                      strokeWidth="2.5"
                    />
                    <circle cx={CLK_CX} cy={CLK_CY} r={CLK_R}
                      fill="white"
                      style={{filter:"drop-shadow(0 2px 8px rgba(0,0,0,0.08))"}}
                    />

                    {/* Time remaining sector (soft fill) */}
                    {focusLeft > 0 && (
                      <path
                        d={sectorPath(focusLeft)}
                        fill={isBreak?"rgba(209,213,219,0.18)":`${FOCUS_COL.ring}18`}
                      />
                    )}

                    {/* Progress arc ring */}
                    <circle
                      cx={CLK_CX} cy={CLK_CY} r={CLK_ARC_R}
                      fill="none"
                      stroke={isBreak?"#e5e7eb":FOCUS_COL.ring}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={CLOCK_CIRC}
                      strokeDashoffset={CLOCK_CIRC*(1-focusLeft/FOCUS_MAX_SECS)}
                      transform={`rotate(-90 ${CLK_CX} ${CLK_CY})`}
                      style={{transition:clkDragging?"none":"stroke-dashoffset 1s linear"}}
                    />

                    {/* Tick marks */}
                    {CLOCK_TICKS.map((t,i)=>(
                      <line key={i}
                        x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                        stroke={t.major?"#9ca3af":"#d1d5db"}
                        strokeWidth={t.major?2:1}
                        strokeLinecap="round"
                      />
                    ))}

                    {/* Minute numbers */}
                    {CLOCK_NUMS.map(n=>(
                      <text key={n.label}
                        x={n.x} y={n.y}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize="11" fontWeight="600"
                        fill={isBreak?"#d1d5db":"#6b7280"}
                        style={{fontFamily:"Lora,serif",userSelect:"none"}}
                      >{n.label}</text>
                    ))}

                    {/* Center image / emoji */}
                    <defs>
                      <clipPath id="clk-center-clip">
                        <circle cx={CLK_CX} cy={CLK_CY} r={95}/>
                      </clipPath>
                    </defs>
                    {clockImage
                      ? <image href={clockImage} x={CLK_CX-95} y={CLK_CY-95} width={190} height={190} clipPath="url(#clk-center-clip)" preserveAspectRatio="xMidYMid slice"/>
                      : <text x={CLK_CX} y={CLK_CY+28} textAnchor="middle" fontSize="100" style={{userSelect:"none",pointerEvents:"none"}}>{clockEmoji}</text>
                    }

                    {/* Clock hand body */}
                    <line
                      x1={CLK_CX} y1={CLK_CY}
                      x2={handPos.x} y2={handPos.y}
                      stroke={isBreak?"#d1d5db":FOCUS_COL.ring}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Counter-balance tail */}
                    <line
                      x1={CLK_CX} y1={CLK_CY}
                      x2={CLK_CX - 22*Math.sin(focusAngle)}
                      y2={CLK_CY + 22*Math.cos(focusAngle)}
                      stroke={isBreak?"#d1d5db":FOCUS_COL.ring}
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Center pip */}
                    <circle cx={CLK_CX} cy={CLK_CY} r="6"
                      fill={isBreak?"#d1d5db":FOCUS_COL.ring}
                      stroke="white" strokeWidth="2"
                    />
                    {/* Draggable handle at hand tip */}
                    <circle
                      cx={handTipPos.x} cy={handTipPos.y} r="12"
                      fill={isBreak?"#d1d5db":FOCUS_COL.ring}
                      stroke="white" strokeWidth="2.5"
                      style={{cursor:running||isBreak?"default":"grab",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.22))"}}
                      onMouseDown={onClkDown}
                      onTouchStart={onClkDown}
                    />
                    <circle cx={handTipPos.x} cy={handTipPos.y} r="5"
                      fill="white" style={{pointerEvents:"none"}}/>
                  </svg>

                  {/* Digital readout under clock */}
                  <div className="text-3xl font-black font-mono mt-2" style={{color:isBreak?"#9ca3af":FOCUS_COL.ring}}>
                    {fmtTime(focusLeft)}
                  </div>
                  <p className="text-xs mt-0.5" style={{color:"#9ca3af",fontFamily:"Lora,serif"}}>
                    {isBreak?"next focus":!running?`${fmtMin(focusMax)} set`:"running…"}
                  </p>

                  {/* Quick-scroll buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={()=>gardenRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                      style={{background:"#e8f5e2",color:"#3d6632",fontFamily:"Lora,serif"}}
                    >🌿 Garden</button>
                    <button
                      onClick={()=>chartRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
                      style={{background:"#dbeafe",color:"#2e5aa8",fontFamily:"Lora,serif"}}
                    >📊 Chart</button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{color:"#d1d5db",fontSize:28,userSelect:"none",alignSelf:"center"}}>⁞</div>

                {/* ── Break ring ── */}
                <div className="flex flex-col items-center">
                  <div className="flex gap-1 mb-1">
                    {[["Short",false,SHORT_DEFAULT],["Long",true,LONG_DEFAULT]].map(([label,isLong,secs])=>(
                      <button key={label}
                        onClick={()=>{if(isBreak||running)return;setIsLongBreak(isLong);setBreakMax(secs);setBreakLeft(secs);}}
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold transition-all"
                        style={{background:isLongBreak===isLong?(isBreak?col.ring:"#e5e7eb"):"transparent",color:isLongBreak===isLong?(isBreak?"#fff":"#374151"):"#9ca3af",fontFamily:"Lora,serif",cursor:isBreak||running?"default":"pointer"}}
                      >{label}</button>
                    ))}
                  </div>
                  <svg width="190" height="190" viewBox="0 0 220 220" className="select-none">
                    <circle cx={BCX} cy={BCY} r={BR+13} fill={isBreak?col.soft:"#f3f4f6"}/>
                    <circle cx={BCX} cy={BCY} r={BR} fill="none" stroke="#e5e7eb" strokeWidth="11" transform={`rotate(-90 ${BCX} ${BCY})`}/>
                    <circle cx={BCX} cy={BCY} r={BR} fill="none" stroke={isBreak?col.ring:"#d1d5db"} strokeWidth="11" strokeLinecap="round" strokeDasharray={BCIRC} strokeDashoffset={breakDash} transform={`rotate(-90 ${BCX} ${BCY})`} style={{transition:"stroke-dashoffset 1s linear,stroke 0.7s"}}/>
                    <text x={BCX} y={BCY+22} textAnchor="middle" fontSize="60" style={{userSelect:"none",pointerEvents:"none"}}>{isLongBreak?"🌸":"☕"}</text>
                  </svg>
                  <div className="text-xl font-black font-mono mt-1" style={{color:isBreak?col.ring:"#9ca3af"}}>{fmtTime(breakLeft)}</div>
                  <p className="text-xs mt-0.5" style={{color:"#9ca3af",fontFamily:"Lora,serif"}}>
                    {isBreak?(running?"running…":"break ready"):"up next"}
                  </p>
                </div>
              </div>

              {/* Session dots */}
              <div className="flex gap-2 mt-4 mb-4">
                {Array.from({length:4}).map((_,i)=>(
                  <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i<cycleDone%4||(cycleDone%4===0&&cycleDone>0)?"bg-primary-600":"bg-gray-200"}`}/>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button onClick={handlePomReset} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Reset"><RotateCcw size={20}/></button>
                <button onClick={()=>setRunning(r=>!r)} className={`w-20 h-20 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 bg-gradient-to-br ${col.bg}`}>
                  {running?<Pause size={32}/>:<Play size={32} className="ml-1"/>}
                </button>
                <button onClick={handlePomSkip} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Skip"><SkipForward size={20}/></button>
              </div>

              {/* Customize */}
              <div className="mt-4">
                <button onClick={()=>setShowCustomizer(true)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-colors" style={{color:"#7a6a50",background:"#f5efe6",fontFamily:"Lora,serif"}}>
                  <Camera size={13}/> Customize center
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                {icon:<Leaf size={18} style={{color:"#4e7e40"}}/>,label:"Plants",val:garden.length},
                {icon:<Trophy size={18} style={{color:"#c9a84c"}}/>,label:"Sessions",val:stats.total},
                {icon:<Flame size={18} style={{color:"#d4956a"}}/>,label:"Streak",val:stats.streak},
              ].map(({icon,label,val})=>(
                <div key={label} className="rounded-2xl p-4 text-center shadow-sm" style={{background:"#fdfcf8",border:"1.5px solid #d4c5a9"}}>
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p className="text-2xl font-bold" style={{color:"#2a1f15",fontFamily:"Playfair Display,serif"}}>{val}</p>
                  <p className="text-xs" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}>{label}</p>
                </div>
              ))}
            </div>

            {/* ── Focus Garden (always visible on Pomodoro tab) ── */}
            <div ref={gardenRef} className="rounded-3xl shadow-lg overflow-hidden w-full max-w-2xl" style={{border:"1.5px solid #d4c5a9"}}>
              <div className="px-6 py-5 flex items-center justify-between" style={{background:"linear-gradient(135deg,#4e7e40 0%,#6aab55 60%,#8cbd7e 100%)"}}>
                <div>
                  <h2 className="text-xl font-bold text-white" style={{fontFamily:"Playfair Display,serif"}}>Focus Garden</h2>
                  <p className="text-sm mt-0.5" style={{color:"rgba(232,240,226,0.85)",fontFamily:"Lora,serif"}}>
                    {garden.length===0
                      ? "Complete a session to plant your first seed!"
                      : `${garden.length} plant${garden.length>1?"s":""} · ${todayCount} today`}
                  </p>
                </div>
                <span className="text-4xl">🌿</span>
              </div>

              <div className="p-5" style={{background:"linear-gradient(180deg,#f0f8ea 0%,#dff0d8 60%,#c8e6be 100%)",minHeight:160}}>
                {garden.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-6xl mb-3 opacity-30">🌱</div>
                    <p className="font-semibold" style={{color:"#3d6632",fontFamily:"Playfair Display,serif"}}>Your garden is empty</p>
                    <p className="text-sm mt-1" style={{color:"#5a8a50",fontFamily:"Lora,serif"}}>Finish a focus session to grow your first plant!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                    {garden.map(plant=>(
                      <div
                        key={plant.id}
                        className={`flex flex-col items-center bg-white/70 backdrop-blur rounded-2xl p-2 border transition-all duration-500 cursor-default
                          ${newPlantId===plant.id
                            ?"border-green-400 shadow-lg shadow-green-200 scale-110 animate-bounce"
                            :"border-green-100 hover:scale-105 hover:shadow-md"}`}
                      >
                        <span className="text-3xl leading-none mb-1">{plant.emoji}</span>
                        <span className="text-xs font-semibold text-green-800 text-center leading-tight">{plant.name}</span>
                        <span className="text-xs text-gray-400 mt-0.5">#{plant.session}</span>
                        {newPlantId===plant.id && (
                          <span className="text-xs font-bold text-green-600 mt-0.5">New! 🎉</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {garden.length>0 && (
                <div className="px-5 py-3 flex items-center justify-between" style={{background:"#e8f5e2",borderTop:"1.5px solid #c8e0c0"}}>
                  <span className="text-sm" style={{color:"#3d6632",fontFamily:"Lora,serif"}}>🌱 Every session grows a new plant!</span>
                  <button
                    onClick={()=>toast.confirm({message:"Clear your entire garden? All plants will be lost.",confirmLabel:"Clear garden",onConfirm:()=>{setGarden([]);saveGarden([]);}})}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >Clear garden</button>
                </div>
              )}
            </div>

            {/* ── Focus Statistics chart ── */}
            <div ref={chartRef} className="rounded-3xl shadow-lg overflow-hidden w-full max-w-2xl" style={{border:"1.5px solid #d4c5a9"}}>
              <div className="px-6 py-5 flex items-center justify-between" style={{background:"linear-gradient(135deg,#2e5aa8 0%,#4a78c8 60%,#7aaae8 100%)"}}>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{fontFamily:"Playfair Display,serif"}}>
                    <BarChart2 size={20}/> Focus Statistics
                  </h2>
                  <p className="text-sm mt-0.5" style={{color:"rgba(200,220,255,0.85)",fontFamily:"Lora,serif"}}>Sessions completed over time</p>
                </div>
                <div className="flex gap-1 rounded-xl overflow-hidden" style={{border:"1.5px solid rgba(255,255,255,0.3)"}}>
                  {[["days","Daily"],["weeks","Weekly"],["months","Monthly"]].map(([view,label])=>(
                    <button key={view} onClick={()=>setChartView(view)} className="px-3 py-1.5 text-xs font-bold transition-colors" style={{background:chartView===view?"rgba(255,255,255,0.25)":"transparent",color:"#fff",fontFamily:"Lora,serif"}}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="p-6" style={{background:"#fdfcf8"}}>
                {garden.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-5xl mb-3 opacity-30">📊</div>
                    <p className="font-semibold" style={{color:"#3d6632",fontFamily:"Playfair Display,serif"}}>No sessions yet</p>
                    <p className="text-sm mt-1" style={{color:"#5a8a50",fontFamily:"Lora,serif"}}>Complete a focus session to see your stats!</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartView==="days"?getDailyData(garden,7):chartView==="weeks"?getWeeklyData(garden,6):getMonthlyData(garden,6)} barCategoryGap="30%" margin={{top:8,right:8,left:-20,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" vertical={false}/>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:"#7a6a50",fontFamily:"Lora,serif"}} axisLine={false} tickLine={false}/>
                      <YAxis allowDecimals={false} tick={{fontSize:11,fill:"#7a6a50",fontFamily:"Lora,serif"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<ChartTooltip/>} cursor={{fill:"rgba(78,126,64,0.07)"}}/>
                      <Bar dataKey="sessions" radius={[6,6,0,0]} maxBarSize={48}>
                        {(chartView==="days"?getDailyData(garden,7):chartView==="weeks"?getWeeklyData(garden,6):getMonthlyData(garden,6)).map((entry,i)=>(
                          <Cell key={i} fill={entry.isToday?"#4e7e40":"#a8d08a"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {garden.length>0 && (
                  <div className="flex items-center gap-4 mt-3 justify-center">
                    <span className="flex items-center gap-1.5 text-xs" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}>
                      <span className="w-3 h-3 rounded-sm inline-block" style={{background:"#4e7e40"}}/>
                      {chartView==="days"?"Today":chartView==="weeks"?"This week":"This month"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}>
                      <span className="w-3 h-3 rounded-sm inline-block" style={{background:"#a8d08a"}}/>
                      Previous {chartView==="days"?"days":chartView==="weeks"?"weeks":"months"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TIMER TAB ══════════════ */}
        {activeTab==="timer" && (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-3xl shadow-lg p-8 flex flex-col items-center w-full max-w-md" style={{background:"#fdfcf8",border:"1.5px solid #d4c5a9"}}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}>
                {tmRun?"running…":"drag handle or set time below"}
              </p>
              <svg ref={timerSvgRef} width="300" height="300" viewBox="0 0 320 320" className="select-none touch-none" style={{cursor:tmRun?"default":tmDrag?"grabbing":"default"}}>
                <circle cx={TCX} cy={TCY} r={TR+18} fill={tmDone?"#fef9c3":"#f5f0e8"}/>
                <circle cx={TCX} cy={TCY} r={TR} fill="none" stroke="#e5e7eb" strokeWidth="14" transform={`rotate(-90 ${TCX} ${TCY})`}/>
                <circle cx={TCX} cy={TCY} r={TR} fill="none" stroke={tmDone?"#f59e0b":"#7c3aed"} strokeWidth="14" strokeLinecap="round" strokeDasharray={TCIRC} strokeDashoffset={tmDash} transform={`rotate(-90 ${TCX} ${TCY})`} style={{transition:tmDrag?"none":"stroke-dashoffset 1s linear"}}/>
                <text x={TCX} y={TCY+20} textAnchor="middle" fontSize="52" fontFamily="monospace" fontWeight="900" fill={tmDone?"#f59e0b":"#7c3aed"}>{fmtTime(tmLeft)}</text>
                {tmDone&&<text x={TCX} y={TCY+52} textAnchor="middle" fontSize="22" fill="#f59e0b" style={{userSelect:"none"}}>⏰ Done!</text>}
                <circle cx={tmHandle.x} cy={tmHandle.y} r="14" fill={tmRun?"#d1d5db":"#7c3aed"} stroke="white" strokeWidth="3" style={{cursor:tmRun?"default":"grab",filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.2))"}} onMouseDown={onTmDown} onTouchStart={onTmDown}/>
                <circle cx={tmHandle.x} cy={tmHandle.y} r="6" fill="white" style={{pointerEvents:"none"}}/>
              </svg>
              <div className="flex items-center gap-2 mt-2 mb-4">
                {[["H",tmH,setTmH,23],["M",tmM,setTmM,59],["S",tmS,setTmS,59]].map(([lbl,val,setter,max])=>(
                  <React.Fragment key={lbl}>
                    <div className="flex flex-col items-center">
                      <input type="number" min={0} max={max} value={val} disabled={tmRun} onChange={e=>setter(Math.min(max,Math.max(0,Number(e.target.value))))} onBlur={applyTimerInput} onKeyDown={e=>e.key==="Enter"&&applyTimerInput()} className="w-14 text-center rounded-xl border py-1.5 text-lg font-bold font-mono outline-none focus:border-violet-400" style={{borderColor:"#d4c5a9",color:"#2a1f15",background:tmRun?"#f3f4f6":"#fff"}}/>
                      <span className="text-xs mt-0.5" style={{color:"#9ca3af",fontFamily:"Lora,serif"}}>{lbl}</span>
                    </div>
                    {lbl!=="S"&&<span className="text-xl font-bold text-gray-300 mb-3">:</span>}
                  </React.Fragment>
                ))}
                {!tmRun&&<button onClick={applyTimerInput} className="mb-3 px-3 py-1.5 rounded-xl text-xs font-bold" style={{background:"#ede9fe",color:"#7c3aed",fontFamily:"Lora,serif"}}>Set</button>}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={()=>{clearInterval(tmInterval.current);setTmRun(false);setTmLeft(tmMax);setTmDone(false);}} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Reset"><RotateCcw size={20}/></button>
                <button onClick={()=>{if(tmLeft===0){setTmLeft(tmMax);setTmDone(false);}else setTmRun(r=>!r);}} className="w-20 h-20 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style={{background:"linear-gradient(135deg,#7c3aed,#a855f7)"}}>
                  {tmRun?<Pause size={32}/>:<Play size={32} className="ml-1"/>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ STOPWATCH TAB ══════════════ */}
        {activeTab==="stopwatch" && (
          <div className="flex flex-col items-center gap-6">
            <div className="rounded-3xl shadow-lg p-8 flex flex-col items-center w-full max-w-md" style={{background:"#fdfcf8",border:"1.5px solid #d4c5a9"}}>
              <div className="text-6xl font-black font-mono tracking-widest mb-1 tabular-nums" style={{color:swRunning?"#d4600a":"#2a1f15"}}>
                {fmtSW(swMs)}
              </div>
              {swLaps.length>0
                ?<p className="text-xs mb-5" style={{color:"#9ca3af",fontFamily:"Lora,serif"}}>Lap {swLaps[0].id}: +{fmtSW(swMs-swLastLap)}</p>
                :<div className="mb-5"/>
              }
              <div className="flex items-center gap-4">
                <button onClick={handleSwReset} className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors" title="Reset"><RotateCcw size={20}/></button>
                <button onClick={toggleSw} className="w-20 h-20 rounded-full text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95" style={{background:swRunning?"linear-gradient(135deg,#dc2626,#ef4444)":"linear-gradient(135deg,#d4600a,#f97316)"}}>
                  {swRunning?<Pause size={32}/>:<Play size={32} className="ml-1"/>}
                </button>
                <button onClick={handleSwLap} disabled={!swRunning} className="p-3 rounded-full transition-colors" style={{background:swRunning?"#fff7ed":"#f3f4f6",color:swRunning?"#d4600a":"#d1d5db"}} title="Lap">
                  <Flag size={20}/>
                </button>
              </div>
            </div>
            {swLaps.length>0&&(
              <div className="rounded-3xl shadow-sm overflow-hidden w-full max-w-md" style={{border:"1.5px solid #d4c5a9"}}>
                <div className="px-5 py-3 flex items-center justify-between" style={{background:"#f5efe6"}}>
                  <p className="text-sm font-bold" style={{color:"#7a6a50",fontFamily:"Playfair Display,serif"}}>Laps</p>
                  <p className="text-xs" style={{color:"#9ca3af",fontFamily:"Lora,serif"}}>{swLaps.length} recorded</p>
                </div>
                <div className="divide-y" style={{background:"#fdfcf8",maxHeight:280,overflowY:"auto"}}>
                  {swLaps.map((lap,idx)=>(
                    <div key={lap.id} className="flex items-center justify-between px-5 py-2.5">
                      <span className="text-xs font-bold" style={{color:idx===0?"#d4600a":"#7a6a50",fontFamily:"Lora,serif"}}>Lap {lap.id}</span>
                      <span className="font-mono text-sm font-bold" style={{color:"#2a1f15"}}>{fmtSW(lap.lap)}</span>
                      <span className="font-mono text-xs" style={{color:"#9ca3af"}}>{fmtSW(lap.split)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ FOCUS GARDEN TAB ══════════════ */}
        {activeTab==="garden" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl shadow-lg overflow-hidden" style={{border:"1.5px solid #d4c5a9"}}>
              <div className="px-8 py-6 flex items-center justify-between" style={{background:"linear-gradient(135deg,#4e7e40 0%,#6aab55 60%,#8cbd7e 100%)"}}>
                <div>
                  <h2 className="text-2xl font-bold text-white" style={{fontFamily:"Playfair Display,serif"}}>Your Focus Garden</h2>
                  <p className="text-sm mt-1" style={{color:"rgba(232,240,226,0.85)",fontFamily:"Lora,serif"}}>
                    {garden.length===0?"Complete a Pomodoro session to plant a seed!":`${garden.length} item${garden.length>1?"s":""} · ${todayCount} today`}
                  </p>
                </div>
                <span className="text-5xl">🌿</span>
              </div>
              <div className="p-6 min-h-64" style={{background:"linear-gradient(180deg,#f0f8ea 0%,#dff0d8 60%,#c8e6be 100%)"}}>
                {garden.length===0?(
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <div className="text-8xl mb-4 opacity-30">🌱</div>
                    <p className="font-semibold text-lg" style={{color:"#3d6632",fontFamily:"Playfair Display,serif"}}>Your garden is empty</p>
                    <p className="text-sm mt-1" style={{color:"#5a8a50",fontFamily:"Lora,serif"}}>Head to the Pomodoro tab and finish a focus session!</p>
                  </div>
                ):(
                  <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-3">
                    {garden.map(plant=>(
                      <div key={plant.id} className={`flex flex-col items-center bg-white/70 backdrop-blur rounded-2xl p-3 border transition-all duration-500 cursor-default ${newPlantId===plant.id?"border-green-400 shadow-lg shadow-green-200 scale-110 animate-bounce":"border-green-100 hover:scale-105 hover:shadow-md"}`}>
                        <span className="text-3xl leading-none mb-1">{plant.emoji}</span>
                        <span className="text-xs font-semibold text-green-800 text-center leading-tight">{plant.name}</span>
                        <span className="text-xs text-gray-400 mt-0.5">#{plant.session}</span>
                        <span className="text-xs text-gray-400">{shortDate(plant.plantedAt)}</span>
                        {newPlantId===plant.id&&<span className="text-xs font-bold text-green-600 mt-1">New! 🎉</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {garden.length>0&&(
                <div className="px-6 py-4 flex items-center justify-between" style={{background:"#e8f5e2",borderTop:"1.5px solid #c8e0c0"}}>
                  <span className="text-sm" style={{color:"#3d6632",fontFamily:"Lora,serif"}}>🌱 Every Pomodoro grows your garden!</span>
                  <button onClick={()=>toast.confirm({message:"Clear your entire garden? All plants will be lost.",confirmLabel:"Clear garden",onConfirm:()=>{setGarden([]);saveGarden([]);}})} className="text-xs text-red-400 hover:text-red-600 transition-colors">Clear garden</button>
                </div>
              )}
            </div>

            {/* Stats chart */}
            <div className="rounded-3xl shadow-lg overflow-hidden" style={{border:"1.5px solid #d4c5a9"}}>
              <div className="px-8 py-5 flex items-center justify-between" style={{background:"linear-gradient(135deg,#2e5aa8 0%,#4a78c8 60%,#7aaae8 100%)"}}>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{fontFamily:"Playfair Display,serif"}}><BarChart2 size={20}/> Focus Statistics</h2>
                  <p className="text-sm mt-0.5" style={{color:"rgba(200,220,255,0.85)",fontFamily:"Lora,serif"}}>Sessions completed over time</p>
                </div>
                <div className="flex gap-1 rounded-xl overflow-hidden" style={{border:"1.5px solid rgba(255,255,255,0.3)"}}>
                  {[["days","Daily"],["weeks","Weekly"],["months","Monthly"]].map(([view,label])=>(
                    <button key={view} onClick={()=>setChartView(view)} className="px-3 py-1.5 text-xs font-bold transition-colors" style={{background:chartView===view?"rgba(255,255,255,0.25)":"transparent",color:"#fff",fontFamily:"Lora,serif"}}>{label}</button>
                  ))}
                </div>
              </div>
              <div className="p-6" style={{background:"#fdfcf8"}}>
                {garden.length===0?(
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="text-5xl mb-3 opacity-30">📊</div>
                    <p className="font-semibold" style={{color:"#3d6632",fontFamily:"Playfair Display,serif"}}>No sessions yet</p>
                    <p className="text-sm mt-1" style={{color:"#5a8a50",fontFamily:"Lora,serif"}}>Complete a focus session to see your stats!</p>
                  </div>
                ):(
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartView==="days"?getDailyData(garden,7):chartView==="weeks"?getWeeklyData(garden,6):getMonthlyData(garden,6)} barCategoryGap="30%" margin={{top:8,right:8,left:-20,bottom:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" vertical={false}/>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:"#7a6a50",fontFamily:"Lora,serif"}} axisLine={false} tickLine={false}/>
                      <YAxis allowDecimals={false} tick={{fontSize:11,fill:"#7a6a50",fontFamily:"Lora,serif"}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<ChartTooltip/>} cursor={{fill:"rgba(78,126,64,0.07)"}}/>
                      <Bar dataKey="sessions" radius={[6,6,0,0]} maxBarSize={48}>
                        {(chartView==="days"?getDailyData(garden,7):chartView==="weeks"?getWeeklyData(garden,6):getMonthlyData(garden,6)).map((entry,i)=>(
                          <Cell key={i} fill={entry.isToday?"#4e7e40":"#a8d08a"}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                {garden.length>0&&(
                  <div className="flex items-center gap-4 mt-3 justify-center">
                    <span className="flex items-center gap-1.5 text-xs" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#4e7e40"}}/>{chartView==="days"?"Today":chartView==="weeks"?"This week":"This month"}</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{color:"#7a6a50",fontFamily:"Lora,serif"}}><span className="w-3 h-3 rounded-sm inline-block" style={{background:"#a8d08a"}}/>Previous {chartView==="days"?"days":chartView==="weeks"?"weeks":"months"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Customizer modal ─────────────────────────────────────────────── */}
      {showCustomizer&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setShowCustomizer(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl overflow-y-auto" style={{border:"1.5px solid #d4c5a9",maxHeight:"80vh"}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold" style={{fontFamily:"Playfair Display,serif",color:"#2a1f15"}}>Customize Clock Center</h3>
              <button onClick={()=>setShowCustomizer(false)} className="p-2 rounded-full hover:bg-gray-100"><X size={18}/></button>
            </div>
            <div className="mb-5 pb-5" style={{borderBottom:"1px solid #e8e0d0"}}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#7a6a50"}}>Custom Image</p>
              <div className="flex items-center gap-3">
                {clockImage&&<img src={clockImage} alt="preview" className="w-14 h-14 rounded-full object-cover border-2" style={{borderColor:FOCUS_COL.ring}}/>}
                <div className="flex flex-col gap-1.5">
                  <button onClick={()=>imageInputRef.current?.click()} className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl" style={{background:FOCUS_COL.soft,color:FOCUS_COL.ring,fontFamily:"Lora,serif"}}><Camera size={15}/>{clockImage?"Change image":"Upload image"}</button>
                  {clockImage&&<button onClick={()=>{setClockImage(null);saveClockImage(null);}} className="text-xs text-red-400 hover:text-red-600 text-left">Remove image</button>}
                </div>
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload}/>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:"#7a6a50"}}>Or choose an emoji</p>
              <div className="grid grid-cols-8 gap-1 overflow-y-auto pr-1" style={{maxHeight:220}}>
                {PLANTS.map(({emoji,name})=>(
                  <button key={emoji} title={name} onClick={()=>{setClockEmoji(emoji);saveClockEmoji(emoji);setClockImage(null);saveClockImage(null);setShowCustomizer(false);}} className="text-2xl p-1.5 rounded-xl transition-all hover:scale-110 hover:bg-primary-50" style={clockEmoji===emoji&&!clockImage?{background:FOCUS_COL.soft,outline:`2px solid ${FOCUS_COL.ring}`}:{}}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
