import React from "react";
import { Link } from "react-router-dom";
import { PenLine, Timer, BookOpen, Film, Camera, Mail } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { Pill, Placeholder, Button } from "../../components/ui";

const SECTIONS = [
  { to: "/journal", icon: PenLine, title: "Journal", desc: "Daily entries on a Bikram Sambat calendar, with moods and photos." },
  { to: "/pomodoro", icon: Timer, title: "Focus", desc: "A Pomodoro timer that grows a little garden with every session." },
  { to: "/books", icon: BookOpen, title: "Books", desc: "A reading log with ratings, reviews and a wishlist." },
  { to: "/movies", icon: Film, title: "Films", desc: "Every film watched, rated and remembered, plus a watchlist." },
  { to: "/memories", icon: Camera, title: "Memories", desc: "A private photo diary, grouped by month." },
];

const TECH = ["React", "Vite", "Tailwind CSS", "Node.js", "Express", "MongoDB"];

export default function About() {
  return (
    <AppLayout>
      <section className="pt-12 pb-10">
        <p className="eyebrow">About</p>
        <h1 className="font-serif font-medium text-ink text-[34px] sm:text-[44px] leading-[1.1] mt-2">
          A small, quiet corner<br />of the internet.
        </h1>
      </section>

      <div className="flex gap-12 flex-wrap items-start">
        <Placeholder className="rounded-[20px]" style={{ flex: "0 0 300px", height: 360 }} />
        <div className="flex flex-col gap-4 text-[17px] text-ink-2" style={{ flex: "1 1 420px", minWidth: 0, maxWidth: 640 }}>
          <p className="font-serif text-ink text-[20px]">
            Hi, I'm Tayama — a computer engineer in Kathmandu who designs and builds things.
          </p>
          <p>
            I made this space because the tools I used every day felt like dashboards. I wanted one place for
            my journal, the books and films I love, my focus sessions and the photos I want to keep — something
            that feels warm and personal.
          </p>
          <p>It started as a weekend project and became the place I open first every morning.</p>
          <div className="flex gap-2.5 flex-wrap mt-2">
            <Button as={Link} to="/contact" icon={Mail}>Say hello</Button>
            <Button as="a" href="https://github.com/Tayama-Kirati" variant="secondary">GitHub</Button>
          </div>
        </div>
      </div>

      <section className="mt-[72px]">
        <p className="eyebrow mb-2">What's inside</p>
        <h2 className="font-serif font-medium text-[26px] text-ink mb-6">Five sections, one rhythm</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {SECTIONS.map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to}
              className="bg-surface border border-line rounded-card p-5 flex flex-col gap-2.5 text-ink hover:border-moss transition-colors">
              <span className="w-9 h-9 rounded-ctl bg-moss-t text-moss-d flex items-center justify-center">
                <Icon size={18} />
              </span>
              <span className="font-semibold text-base">{title}</span>
              <span className="text-[13px] text-ink-2">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14 pb-4">
        <p className="eyebrow mb-2">How it's built</p>
        <div className="flex gap-2 flex-wrap">
          {TECH.map((t) => <Pill key={t}>{t}</Pill>)}
        </div>
      </section>
    </AppLayout>
  );
}
