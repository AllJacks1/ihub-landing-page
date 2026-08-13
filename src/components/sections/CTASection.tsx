"use client";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#F36509] via-[#e05a00] to-orange-700 px-4 py-20 sm:px-6 sm:py-28 md:py-32">
      {/* Decorative noise background pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating blurred shapes */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-black/20 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 border border-white/30 backdrop-blur-md shadow-2xl"
        >
          <Sparkles className="h-7 w-7 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-5 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Ready to create
          <br />
          and celebrate?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-white/90 sm:mb-12 sm:text-lg md:text-xl font-sans"
        >
          Join Davao&apos;s most vibrant 24/7 coworking community. Your desk,
          your coffee, your vibe — waiting for you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <Button
            size="lg"
            className="h-12 w-full max-w-xs rounded-full bg-white px-8 text-base font-bold text-[#F36509] shadow-2xl shadow-black/20 transition-all hover:bg-stone-100 hover:scale-105 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg md:h-16 md:px-12 cursor-pointer"
            render={
              <Link
                href="/booking?type=bistro"
                className="inline-flex items-center gap-2"
              >
                Reserve a Table
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            }
          />

          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full max-w-xs rounded-full border-2 border-white/60 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white hover:text-[#F36509] hover:scale-105 active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg md:h-16 md:px-12 cursor-pointer"
            render={<Link href="/booking?type=conference">Book a Space</Link>}
          />
        </motion.div>
      </div>
    </section>
  );
}
