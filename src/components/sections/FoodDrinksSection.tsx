"use client";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import {
  Coffee,
  UtensilsCrossed,
  GlassWater,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const tags = [
  { label: "New Pasta Lineup", icon: UtensilsCrossed },
  { label: "Comfort Food", icon: Coffee },
  { label: "Signature Drinks", icon: GlassWater },
];

export default function FoodDrinksSection() {
  return (
    <section className="bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-2 md:order-1"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F36509]/15 border border-[#F36509]/30 px-4 py-1.5 text-xs font-mono font-bold text-[#F36509]">
              <Coffee className="h-4 w-4" />
              24/7 BISTRO & CAFÉ
            </div>

            <h2 className="mb-5 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
              Coffee. Meals.
              <br />
              <span className="text-[#F36509]">Good Vibes.</span>
            </h2>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-stone-300 sm:mb-10 sm:text-lg md:text-xl">
              Fuel your productivity with artisan coffee, hearty meals, snacks,
              and refreshing drinks — available 24/7.
            </p>

            <div className="mb-8 flex flex-wrap gap-2.5 sm:mb-10 sm:gap-3">
              {tags.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="outline"
                  className="border-stone-800 bg-stone-900/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-300 transition-colors hover:border-[#F36509]/40 hover:text-[#F36509]"
                >
                  <tag.icon className="mr-2 h-4 w-4 text-[#F36509]" />
                  {tag.label}
                </Badge>
              ))}
            </div>

            <Link
              href="/bistro"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e05a00] hover:scale-105 sm:h-14 sm:px-10 sm:text-base cursor-pointer"
            >
              Explore 24/7 Menu
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </Link>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 md:order-2"
          >
            <div className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 shadow-2xl shadow-orange-500/5 sm:aspect-16/20 sm:rounded-3xl">
              <Image
                src="/images/food.png"
                alt="iHub Café - Artisan coffee and hearty meals"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />

              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                <div className="flex items-center gap-3 rounded-2xl bg-stone-950/90 border border-stone-800 px-4 py-3 shadow-2xl backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]/20 border border-[#F36509]/40 text-[#F36509]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-white sm:text-lg font-mono">
                      24/7 OPEN
                    </div>
                    <div className="text-xs text-stone-400 font-sans">
                      Kitchen & Coffee Bar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
