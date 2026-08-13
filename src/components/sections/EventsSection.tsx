"use client";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Gamepad2, MessageCircle, Sparkles } from "lucide-react";

const events = [
  {
    title: "Live Acoustic Nights",
    description:
      "Chill with acoustic sets, local Davao artists, and great company every week.",
    image: "/images/live_music.png",
    icon: Music,
    iconBg: "bg-rose-500/15 border border-rose-500/30",
    iconColor: "text-rose-400",
    tag: "Every Friday Night",
  },
  {
    title: "Friday Game Nights",
    description:
      "Board games, multiplayer setup, signature drinks, laughs, and weekend energy.",
    image: "/images/game_nights.png",
    icon: Gamepad2,
    iconBg: "bg-amber-500/15 border border-amber-500/30",
    iconColor: "text-amber-400",
    tag: "Fridays 8 PM",
    featured: true,
  },
  {
    title: "Casual Catch-ups",
    description:
      "The best stories and networking happen around our open collaborative tables.",
    image: "/images/catch_ups.png",
    icon: MessageCircle,
    iconBg: "bg-emerald-500/15 border border-emerald-500/30",
    iconColor: "text-emerald-400",
    tag: "Daily 24/7",
  },
];

export default function EventsSection() {
  return (
    <section
      id="events"
      className="bg-stone-950 px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-[#F36509] text-xs font-mono font-bold tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" /> DAVAO COMMUNITY VIBES
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
            Why stay home when the vibe is here?
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-400 sm:text-lg md:text-xl">
            Live acoustic music • Friday game nights • Artisan drinks •
            Unforgettable community
          </p>
        </motion.div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {events.map((event, index) => (
            <motion.div
              key={event.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card
                className={`pt-0 h-full flex flex-col justify-between group overflow-hidden border bg-stone-900/50 backdrop-blur-xl shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                  event.featured
                    ? "border-[#F36509]/50 shadow-orange-500/10 ring-1 ring-[#F36509]/30"
                    : "border-stone-800 hover:border-stone-700"
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-stone-950">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-75"
                    style={{ backgroundImage: `url(${event.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/20 to-transparent" />

                  <Badge
                    className={`absolute left-3 top-3 text-xs sm:left-4 sm:top-4 ${
                      event.featured
                        ? "bg-[#F36509] text-white shadow-lg"
                        : "bg-stone-950/80 text-stone-200 border border-stone-800 backdrop-blur-md"
                    }`}
                  >
                    {event.tag}
                  </Badge>

                  <div
                    className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-xl backdrop-blur-md sm:bottom-4 sm:right-4 sm:h-12 sm:w-12 ${event.iconBg}`}
                  >
                    <event.icon className={`h-5 w-5 ${event.iconColor}`} />
                  </div>
                </div>

                <CardContent className="px-6 pb-6 pt-6 sm:px-6 sm:pb-8">
                  <h3 className="mb-2 font-serif text-xl font-bold text-white sm:text-2xl">
                    {event.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-400">
                    {event.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
