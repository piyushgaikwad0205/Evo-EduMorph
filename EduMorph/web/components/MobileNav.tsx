"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
        aria-label="Open menu"
      >
        <Menu size={24} className="text-slate-700 dark:text-slate-200" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Sidebar */}
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <div className="h-full overflow-y-auto">
              <Sidebar mobile onNavigate={() => setIsOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
