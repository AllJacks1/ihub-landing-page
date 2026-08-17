"use client";
import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    image: "/images/iWork.png",
    imageAlt: "iWork coworking space",
    title: "iWork",
    subtitle: "COWORKING & FLEX DESKS",
    description:
      "High-speed internet (up to 600 Mbps), ergonomic spaces, and 24/7 access for freelancers, remote workers, and builders.",
    cta: "Try iWork Pass ₱2,500",
    href: "/passes",
  },
  {
    image: "/images/iStudy.png",
    imageAlt: "iStudy quiet zone",
    title: "iStudy",
    subtitle: "QUIET FOCUS ZONES",
    description:
      "Quiet zones, all-day passes, and a focused environment to help you succeed tomorrow.",
    cta: "Reserve Study Space",
    href: "/booking?type=workspace",
  },
  {
    image: "/images/iPlay.png",
    imageAlt: "iPlay live music",
    title: "iPlay",
    subtitle: "LIVE MUSIC & EVENTS",
    description:
      "Live acoustic music, weekend vibes, games, drinks, and unforgettable conversations.",
    cta: "Join the Vibe Tonight",
    href: "#events",
  },
  {
    image: "/images/iEat.png",
    imageAlt: "iEat food and drinks",
    title: "iEat",
    subtitle: "24/7 BISTRO MENU",
    description:
      "Comfort food, new pasta lineup, snacks, and hearty meals to fuel your day.",
    cta: "Explore the Menu",
    href: "/bistro",
  },
  {
    image: "/images/iDrink.png",
    imageAlt: "iDrink signature cocktails",
    title: "iDrink",
    subtitle: "ARTISAN COFFEE & COCKTAILS",
    description:
      "Unwind with friends. Games, signature drinks, live music, and weekend energy.",
    cta: "End your week at iHub",
    href: "#events",
  },
];

export default function WhySection() {
  return (
    <section
      id="spaces"
      className="relative bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden"
    >
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[400px] h-[400px] bg-[#F36509]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-[#F36509] text-xs font-mono font-bold tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" /> FIVE ZONES, ONE COMMUNITY
          </div>

          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Create your future.
            <br />
            <span className="text-[#F36509]">Celebrate your now.</span>
          </h2>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-400 sm:text-lg md:text-xl">
            Davao&apos;s first 24/7 coworking bistro hub. Where work meets good
            food, great coffee, and even better company.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group h-full flex flex-col overflow-hidden border-stone-800 bg-stone-900/50 backdrop-blur-xl shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-[#F36509]/50 hover:shadow-2xl hover:shadow-orange-500/10 pt-0">
                <div className="relative h-52 w-full overflow-hidden bg-stone-950 sm:h-60">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/30 to-transparent" />
                  <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-mono font-bold text-[#F36509] border border-stone-800 tracking-wider">
                    {feature.subtitle}
                  </span>
                </div>

                <CardHeader className="px-5 pt-5 pb-2 sm:px-6 sm:pt-6">
                  <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                    {feature.title}
                  </h3>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-between space-y-6 px-5 pb-6 sm:px-6 sm:pb-8">
                  <p className="text-sm leading-relaxed text-stone-400 sm:text-base">
                    {feature.description}
                  </p>

                  <Link
                    href={feature.href}
                    className="group/link inline-flex min-h-11 items-center gap-2 font-semibold text-[#F36509] transition-colors hover:text-orange-400 text-sm sm:text-base cursor-pointer"
                  >
                    {feature.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1.5" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
