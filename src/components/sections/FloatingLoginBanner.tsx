// components/sections/FloatingLoginBanner.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function FloatingLoginBanner() {
  const [expanded, setExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  // Auto-shrink
  useEffect(() => {
    if (!expanded) return;

    const timer = setTimeout(() => {
      setExpanded(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [expanded]);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className={cn(
            "fixed z-50",
            "bottom-4 left-4 right-4",
            "sm:bottom-6 sm:left-auto sm:right-6",
          )}
        >
          <motion.div
            layout
            onMouseEnter={() => {
              if (window.matchMedia("(hover: hover)").matches) {
                setExpanded(true);
              }
            }}
            onMouseLeave={() => {
              if (window.matchMedia("(hover: hover)").matches) {
                setExpanded(false);
              }
            }}
            className={cn(
              "flex items-center overflow-hidden rounded-2xl border border-stone-200 bg-white/95 shadow-lg backdrop-blur-sm",
              expanded
                ? "w-full gap-2 px-3 py-3 sm:w-auto sm:gap-3 sm:px-4"
                : "mx-auto h-12 w-12 cursor-pointer justify-center p-0 sm:mx-0 sm:h-14 sm:w-14",
            )}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Logo */}
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-9 sm:w-9"
              aria-label={
                expanded ? "Collapse login banner" : "Expand login banner"
              }
            >
              <Image
                src="/images/iaccess_logo.png"
                alt="iAccess"
                width={36}
                height={36}
                className="h-8 w-8 object-contain sm:h-9 sm:w-9"
                priority
              />
            </button>

            {/* Expandable content */}
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="flex min-w-0 items-center gap-2 overflow-hidden sm:gap-3"
                >
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <p className="truncate text-sm font-semibold text-stone-900">
                      Login to your iAccess Account
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      Access points, rewards & more
                    </p>
                  </div>

                  <Link
                    href="/iaccess/login"
                    className="shrink-0 rounded-lg bg-[#F36509] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#e05a00] sm:px-3.5"
                  >
                    Login
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDismissed(true);
                    }}
                    className="shrink-0 rounded-md p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
