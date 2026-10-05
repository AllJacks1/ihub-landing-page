"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getActiveEvents } from "@/lib/actions"; // adjust path if needed
import { Event } from "@/lib/types/event";

const DISMISS_KEY = "ihub_active_events_dismissed";
const DISMISS_TTL_MS = 10 * 60 * 1000; // 10 minutes

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export default function ActiveEventsPopup() {
  const [events, setEvents] = useState<Event[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right

  const handleClose = useCallback(() => {
    setOpen(false);
    setDismissed();
  }, []);

  const goTo = useCallback(
    (next: number) => {
      if (events.length === 0) return;
      setDirection(next > index ? 1 : -1);
      setIndex((next + events.length) % events.length);
    },
    [events.length, index],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isDismissed()) {
        setLoading(false);
        return;
      }

      try {
        const res = await getActiveEvents();
        if (cancelled) return;

        if (res.success && res.data.length > 0) {
          setEvents(res.data);
          setIndex(0);
          setTimeout(() => {
            if (!cancelled) setOpen(true);
          }, 800);
        }
      } catch (err) {
        console.error("Failed to load active events:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard: Esc, arrows
  useEffect(() => {
    if (!open && !zoomSrc) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomSrc) {
          setZoomSrc(null);
          setZoomScale(1);
        } else {
          handleClose();
        }
        return;
      }

      if (zoomSrc) return; // don't navigate while zoomed

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, zoomSrc, handleClose, goPrev, goNext]);

  if (loading || events.length === 0) return null;

  const event = events[index];
  const hasMultiple = events.length > 1;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-100 bg-black/70 backdrop-blur-sm"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="active-events-title"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="fixed inset-0 z-101 flex items-center justify-center p-3 sm:p-6 pointer-events-none"
            >
              <div
                className="pointer-events-auto relative w-full max-w-xl max-h-[90vh] overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl shadow-orange-500/10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#F36509]/20 rounded-full blur-[80px] pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-stone-800/80">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 mb-2 rounded-full bg-[#F36509]/15 border border-[#F36509]/30 text-[#F36509] text-[10px] font-bold tracking-widest uppercase">
                      <Sparkles className="w-3 h-3" />
                      Happening Now
                      {hasMultiple && (
                        <span className="text-stone-400 font-normal normal-case tracking-normal">
                          · {index + 1}/{events.length}
                        </span>
                      )}
                    </div>
                    <h2
                      id="active-events-title"
                      className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-white"
                    >
                      Live at iHub
                    </h2>
                    <p className="mt-1 text-sm text-stone-400">
                      Don&apos;t miss what&apos;s going on right now.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-400 transition hover:border-stone-500 hover:text-white cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* ── Carousel ── */}
                <div className="relative">
                  <AnimatePresence
                    mode="wait"
                    custom={direction}
                    initial={false}
                  >
                    <motion.article
                      key={event.id}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="group"
                    >
                      {/* Large image — click to zoom */}
                      {event.image ? (
                        <button
                          type="button"
                          onClick={() => {
                            setZoomSrc(event.image);
                            setZoomScale(1);
                          }}
                          className="relative block w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-stone-950 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F36509] focus-visible:ring-inset"
                          aria-label={`Zoom image for ${event.title}`}
                        >
                          <Image
                            src={event.image}
                            alt={event.title}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 640px) 100vw, 576px"
                            quality={90}
                            priority
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 text-[10px] font-medium text-white/90">
                            <ZoomIn className="h-3 w-3" />
                            Tap to zoom
                          </span>
                        </button>
                      ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-stone-950 text-stone-600 sm:h-48">
                          <Calendar className="h-10 w-10" />
                        </div>
                      )}

                      {/* Meta */}
                      <div className="px-5 py-4 sm:px-6 sm:py-5">
                        <h3 className="font-serif text-xl sm:text-2xl font-semibold leading-tight text-white">
                          {event.title}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#F36509]" />
                            {formatDate(event.start_date)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#F36509]" />
                            {formatTime(event.start_date)}
                            {/* –{" "}
                            {formatTime(event.end_date)} */}
                          </span>
                        </div>

                        {event.description && (
                          <Description text={event.description} />
                        )}
                      </div>
                    </motion.article>
                  </AnimatePresence>

                  {/* Prev / Next arrows (only when multiple) */}
                  {hasMultiple && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-2 top-[28%] sm:top-[30%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/80 text-white backdrop-blur-md transition hover:border-[#F36509] hover:text-[#F36509] cursor-pointer"
                        aria-label="Previous event"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-2 top-[28%] sm:top-[30%] -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-stone-700/80 bg-stone-950/80 text-white backdrop-blur-md transition hover:border-[#F36509] hover:text-[#F36509] cursor-pointer"
                        aria-label="Next event"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Dots */}
                {hasMultiple && (
                  <div className="flex items-center justify-center gap-1.5 pb-1">
                    {events.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Go to event ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === index
                            ? "w-5 bg-[#F36509]"
                            : "w-1.5 bg-stone-600 hover:bg-stone-400"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Footer CTA */}
                <div className="relative border-t border-stone-800/80 px-5 py-4 sm:px-6 bg-stone-950/80">
                  <Link
                    href="/contact?intent=event"
                    onClick={handleClose}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F36509] px-6 text-base font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-[#e05a00] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Enquire Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-2.5 text-center text-[11px] text-stone-500">
                    Or close this and explore the rest of iHub
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Image Zoom Lightbox ── */}
      <AnimatePresence>
        {zoomSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-110 flex flex-col bg-black/95"
            onClick={() => {
              setZoomSrc(null);
              setZoomScale(1);
            }}
          >
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm text-stone-400">
                Pinch or use buttons to zoom
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.max(0.5, s - 0.25))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-300 hover:text-white cursor-pointer"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale((s) => Math.min(3, s + 0.25))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-300 hover:text-white cursor-pointer"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomSrc(null);
                    setZoomScale(1);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-stone-300 hover:text-white cursor-pointer"
                  aria-label="Close zoom"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 overflow-auto touch-pan-x touch-pan-y"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex min-h-full min-w-full items-center justify-center p-4">
                <motion.div
                  animate={{ scale: zoomScale }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative max-w-[95vw] origin-center"
                  style={{ width: "min(95vw, 900px)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={zoomSrc}
                    alt="Event poster"
                    className="w-full h-auto rounded-lg shadow-2xl select-none"
                    draggable={false}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsClamp = text.length > 120; // rough threshold; adjust if needed

  return (
    <div className="mt-2.5">
      <p
        className={`text-sm leading-relaxed text-stone-400 ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-semibold text-[#F36509] hover:text-orange-400 transition cursor-pointer"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}
