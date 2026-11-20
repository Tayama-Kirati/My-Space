import React from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Navbar/Footer/Footer";

/** Standard page shell: top bar + content + footer. */
export default function AppLayout({ children, container = true }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        {container ? <div className="wrap">{children}</div> : children}
      </main>
      <Footer />
    </div>
  );
}
