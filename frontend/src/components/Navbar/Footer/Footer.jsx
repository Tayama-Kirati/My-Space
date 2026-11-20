import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-[72px] pt-7 pb-9">
      <div className="wrap flex justify-between items-center gap-4 flex-wrap text-[13px] text-ink-3">
        <span>Tayama's Space · made in Kathmandu</span>
        <nav aria-label="Site" className="flex gap-5 flex-wrap">
          <Link to="/about" className="text-ink-2 hover:text-ink">About</Link>
          <Link to="/contact" className="text-ink-2 hover:text-ink">Contact</Link>
          <a href="mailto:tayamab2003@gmail.com" className="text-ink-2 hover:text-ink">
            tayamab2003@gmail.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
