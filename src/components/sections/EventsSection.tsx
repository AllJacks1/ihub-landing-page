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
    tag: "Every Friday Nights ",
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
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
            Why stay home when the vibe is here?
          </h2>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-500">
            Live acoustic music • Friday nights • Games • Friends •
            Unforgettable weekends
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.title}
              className={`group overflow-hidden border-0 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                event.featured
                  ? "ring-2 ring-[#F36509]/20 hover:ring-[#F36509]/40"
                  : ""
              }`}
            >
              {/* Image Area */}
              <div className="relative aspect-[4/3] overflow-hidden -mt-6">
                <div
                  className="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${event.image})` }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-stone-900/10 to-transparent" />

                {/* Tag */}
                <Badge
                  className={`absolute left-4 top-4 ${
                    event.featured
                      ? "bg-[#F36509] text-white hover:bg-[#F36509]"
                      : "bg-white/95 text-stone-900 backdrop-blur-sm hover:bg-white"
                  }`}
                >
                  {event.tag}
                </Badge>

                {/* Icon floating at bottom */}
                <div
                  className={`absolute bottom-2 right-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${event.iconBg}`}
                >
                  <event.icon className={`h-7 w-7 ${event.iconColor}`} />
                </div>
              </div>

              {/* Content */}
              <CardContent className="pt-10 pb-8 px-8">
                <h3 className="mb-3 font-serif text-2xl font-semibold text-stone-900">
                  {event.title}
                </h3>
                <p className="leading-relaxed text-stone-500">
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
