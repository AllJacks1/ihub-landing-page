"use client";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Wifi,
  Coffee,
  Armchair,
  Droplets,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: Wifi,
    text: "High-speed internet (up to 600 Mbps)",
  },
  {
    icon: Armchair,
    text: "Perfect for remote work, online classes, meetings & catch-ups",
  },
  {
    icon: Coffee,
    text: "Complimentary mineral water + full café menu 24/7",
  },
  {
    icon: Droplets,
    text: "Air-conditioned, charging stations, comfortable seating",
  },
];

export default function ILoungeSection() {
  return (
    <section className="relative overflow-hidden bg-stone-950 px-4 py-20 sm:px-6 sm:py-24 md:py-28">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-125 h-125 bg-[#F36509]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="order-2 md:order-1"
        >
          <Badge className="mb-5 px-4 py-1.5 text-xs font-bold tracking-widest sm:mb-6 sm:px-5 sm:py-2 sm:text-sm uppercase font-mono">
            FREE ACCESS • NO HOURLY RENTAL FEE
          </Badge>

          <h2 className="mb-5 font-serif text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl lg:text-6xl">
            Meet <span className="text-[#F36509]">iLounge</span>
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-stone-300 sm:mb-10 sm:text-xl md:text-2xl font-sans">
            Your new favorite open collaborative space. No hourly rental fee —
            just enjoy something from our café.
          </p>

          <ul className="mb-10 space-y-4 sm:mb-12 sm:space-y-5">
            {features.map((feature, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-start gap-3 sm:gap-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/20 border border-[#F36509]/30 text-[#F36509]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <span className="text-base text-stone-300 sm:text-lg">
                  {feature.text}
                </span>
              </motion.li>
            ))}
          </ul>

          <Button
            size="lg"
            className="h-12 rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-[#e05a00] hover:scale-105 active:scale-95 sm:h-14 sm:px-10 sm:text-lg cursor-pointer"
            render={
              <Link
                href="/booking?type=bistro"
                className="inline-flex items-center gap-2"
              >
                Visit iLounge Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            }
          />
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="order-1 md:order-2"
        >
          <div className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-2xl shadow-orange-500/5 sm:rounded-3xl">
            <Image
              src="/images/iLounge.png"
              alt="iLounge at iHub - Open collaborative coworking space"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-stone-950/80 via-transparent to-transparent" />

            {/* Live Indicator Badge */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <div className="flex items-center gap-2.5 rounded-full bg-stone-950/90 border border-stone-800 px-4 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md sm:text-sm">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span>Open 24/7 • High Speed Fiber</span>
              </div>
            </div>

            {/* Speed Badge */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <div className="flex items-center gap-2 rounded-2xl bg-[#F36509] px-3.5 py-2 text-xs font-bold text-white shadow-lg">
                <Zap className="h-4 w-4" /> 600 Mbps
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
