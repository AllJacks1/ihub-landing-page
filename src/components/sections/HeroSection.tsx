"use client";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0a] pt-20">
      {/* Background Image with Dark Vignette */}
      <Image
        src="/images/hero.png"
        alt="iHub Coworking Bistro Davao"
        fill
        className="object-cover opacity-40 scale-105"
        priority
        quality={85}
        sizes="100vw"
      />

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-125 h-125 bg-[#F36509]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-112.5 h-112.5 bg-stone-800/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/60 to-[#0a0a0a]" />

      {/* Content */}
      <div className="mt-20 relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 py-12 sm:mt-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-[#F36509]/15 border border-[#F36509]/30 rounded-full text-[#F36509] text-xs font-bold tracking-widest mb-6"
        >
          <span className="w-2 h-2 bg-[#F36509] rounded-full animate-ping" />
          DAVAO&apos;S FIRST 24/7 COWORKING BISTRO
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mb-6 font-serif text-4xl leading-[1.05] tracking-tighter text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]"
        >
          Work. Eat. Drink.
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#F36509] via-orange-400 to-amber-200">
            Play 24/7
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-stone-300 sm:text-lg md:text-xl font-sans"
        >
          Davao&apos;s first coworking bistro hub.
          <br className="hidden sm:block" />
          Your space to create, connect, and celebrate — flexible work zones,
          good food, artisan coffee, and good vibes all in one community.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 mb-12"
        >
          <Link
            href="/booking?type=bistro"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-[#e05a00] hover:scale-105 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg cursor-pointer"
          >
            Reserve a Table
          </Link>

          <Link
            href="/booking?type=conference"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full border border-stone-700 bg-stone-900/60 backdrop-blur-md px-8 text-base font-semibold text-stone-200 transition-all hover:border-[#F36509] hover:text-[#F36509] hover:scale-105 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg cursor-pointer"
          >
            Book Conference Room
          </Link>
        </motion.div>

        {/* Quick Metrics Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="inline-flex items-center justify-center gap-6 sm:gap-10 px-6 py-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl sm:text-3xl font-bold text-white font-serif">
              24/7
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold font-mono">
              Always Open
            </span>
          </div>

          <div className="w-px h-8 bg-stone-800" />

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl sm:text-3xl font-bold text-white font-serif">
              600
              <span className="text-xs font-normal text-stone-400 font-sans">
                Mbps
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold font-mono">
              Fiber Internet
            </span>
          </div>

          <div className="w-px h-8 bg-stone-800" />

          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl sm:text-3xl font-bold text-[#F36509] font-serif">
              FREE
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold font-mono">
              Lounge Fee
            </span>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-[10px] tracking-widest text-stone-400 sm:bottom-8 font-mono uppercase"
      >
        SCROLL TO EXPLORE
        <div className="mt-2 h-8 w-px bg-linear-to-b from-[#F36509] to-transparent sm:h-10" />
      </motion.div>
    </div>
  );
}
