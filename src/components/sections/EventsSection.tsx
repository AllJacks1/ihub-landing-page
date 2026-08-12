import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Gamepad2, MessageCircle } from "lucide-react";

const events = [
  {
    title: "Live Music Nights",
    description: "Chill with acoustic sets and great company",
    image: "/images/live_music.png",
    icon: Music,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
    tag: "Every Friday Night",
  },
  {
    title: "Friday Game Nights",
    description: "Drinks, laughs, and weekend energy",
    image: "/images/game_nights.png",
    icon: Gamepad2,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    tag: "Fridays",
    featured: true,
  },
  {
    title: "Casual Catch-ups",
    description: "The best stories happen around our tables",
    image: "/images/catch_ups.png",
    icon: MessageCircle,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    tag: "Daily",
  },
];

export default function EventsSection() {
  return (
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Why stay home when the vibe is here?
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-500 sm:text-lg md:text-xl">
            Live acoustic music • Friday nights • Games • Friends •
            Unforgettable weekends
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.title}
              className={`pt-0 group overflow-hidden border-0 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                event.featured
                  ? "ring-2 ring-[#F36509]/20 hover:ring-[#F36509]/40"
                  : ""
              }`}
            >
              <div className="relative aspect-4/3 overflow-hidden">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${event.image})` }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-stone-900/60 via-stone-900/10 to-transparent" />

                <Badge
                  className={`absolute left-3 top-3 text-xs sm:left-4 sm:top-4 ${
                    event.featured
                      ? "bg-[#F36509] text-white hover:bg-[#F36509]"
                      : "bg-white/95 text-stone-900 backdrop-blur-sm hover:bg-white"
                  }`}
                >
                  {event.tag}
                </Badge>

                <div
                  className={`absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg sm:bottom-4 sm:right-6 sm:h-14 sm:w-14 sm:rounded-2xl ${event.iconBg}`}
                >
                  <event.icon
                    className={`h-5 w-5 sm:h-7 sm:w-7 ${event.iconColor}`}
                  />
                </div>
              </div>

              <CardContent className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
                <h3 className="mb-2 font-serif text-xl font-semibold text-stone-900 sm:mb-3 sm:text-2xl">
                  {event.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-500 sm:text-base">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
