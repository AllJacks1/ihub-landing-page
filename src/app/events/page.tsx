import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Star,
  Sparkles,
  Users,
  Heart,
  PartyPopper,
} from "lucide-react";

const events = [
  {
    title: "Ghost Town Photo Contest 2025",
    description:
      "We turned iHub into a spooky Ghost Town! Participants showed off their best eerie, funny, and fabulous costumes and photos. Winners took home spooktacular prizes sponsored by J-MaVe Cars.",
    image: "/events/halloween2025.jpg",
    date: "October 31, 2025",
    tag: "Halloween 2025",
    tagIcon: PartyPopper,
    status: "Completed",
    highlight: "Thank you to all who joined!",
  },
  {
    title: "iHub Anonymous Confessions",
    description:
      "Some thoughts are better left anonymous… but this Valentine's, we let them out. Hearts spoke freely with no names, no judgment — just real emotions in a safe, fun space.",
    image: "/events/confession.jpg",
    date: "February 2026",
    tag: "Valentine's 2026",
    tagIcon: Heart,
    status: "Completed",
    highlight: "Love was truly in the air 💘",
  },
  {
    title: "iHub Speed Match",
    description:
      "Find your spark in 60 seconds! A fun, fast-paced speed dating event for singles. Quick chats, real connections, and acoustic music after. Bring 3 friends and get in for FREE!",
    image: "/events/speed_match.jpg",
    date: "February 14, 2026 | 6:00 PM – 8:00 PM",
    tag: "Valentine's 2026",
    tagIcon: Heart,
    status: "Completed",
    highlight: "Thank you to all who joined!",
  },
];

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden sm:min-h-170">
        <Image
          src="/images/events-hero.png"
          alt="iHub Events"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-stone-900/80 via-stone-900/60 to-stone-900/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="mb-5 border-stone-600 px-3 py-1 text-xs font-bold tracking-widest text-stone-400 sm:mb-6 sm:px-4 sm:py-1.5"
          >
            iPLAY • iHub Events
          </Badge>

          <h1 className="mb-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Events at iHub
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-200 sm:text-lg md:text-xl">
            Where good vibes, great people, and unforgettable moments come
            together.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-[#F36509] sm:mt-10 sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            CREATE YOUR FUTURE. CELEBRATE YOUR NOW.
          </div>
        </div>
      </section>

      {/* ===== PAST HIGHLIGHTS ===== */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
              Past Highlights
            </h2>
            <p className="mx-auto max-w-xl text-base text-stone-500 sm:text-lg md:text-xl">
              Memories we made together. Join us for the next one.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <Card
                key={i}
                className="group overflow-hidden border-stone-200 bg-white pt-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/5"
              >
                {/* Image */}
                <div className="relative aspect-4/3 overflow-hidden bg-stone-200">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                    priority={i < 3}
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-900/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Tag */}
                  <Badge className="absolute left-3 top-3 border-0 bg-white/95 text-xs font-bold text-stone-900 backdrop-blur-sm hover:bg-white sm:left-4 sm:top-4">
                    <event.tagIcon className="mr-1.5 h-3 w-3 text-[#F36509]" />
                    {event.tag}
                  </Badge>

                  {/* Status */}
                  <Badge
                    className={`absolute right-3 top-3 border-0 text-xs font-bold sm:right-4 sm:top-4 ${
                      event.status === "Upcoming"
                        ? "bg-emerald-500 text-white"
                        : "bg-stone-800/80 text-stone-300"
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-5 sm:p-6">
                  <h3 className="mb-2 font-serif text-xl font-semibold leading-tight text-stone-900 sm:mb-3 sm:text-2xl">
                    {event.title}
                  </h3>

                  <p className="mb-4 text-sm leading-relaxed text-stone-500 sm:mb-5">
                    {event.description}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Calendar className="h-4 w-4 shrink-0 text-[#F36509]" />
                      <span>{event.date}</span>
                    </div>

                    {event.highlight && (
                      <div className="flex items-center gap-2 text-sm font-medium text-[#F36509]">
                        <Star className="h-4 w-4 shrink-0 fill-[#F36509]" />
                        <span>{event.highlight}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-stone-900 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            {[
              { icon: Calendar, label: "Events Hosted", value: "3" },
              { icon: Users, label: "Attendees", value: "100+" },
              { icon: Heart, label: "Connections Made", value: "100+" },
              { icon: Sparkles, label: "Prizes Given", value: "10+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]/20 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-2xl">
                  <stat.icon className="h-5 w-5 text-[#F36509] sm:h-6 sm:w-6" />
                </div>
                <div className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </div>
                <div className="text-xs text-stone-400 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CALL TO ACTION ===== */}
      <section className="relative overflow-hidden bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#F36509]/10 blur-3xl sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F36509]/10 sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Sparkles className="h-6 w-6 text-[#F36509] sm:h-7 sm:w-7" />
          </div>

          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
            Want to host your next event at iHub?
          </h2>

          <p className="mb-8 text-base leading-relaxed text-stone-500 sm:mb-10 sm:text-lg md:text-xl">
            From intimate gatherings to big celebrations — we&apos;ve got the
            space and vibes for it.
          </p>

          <Button
            size="lg"
            className="h-12 rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:px-10 sm:text-base"
            render={
              <Link href="/contact" className="inline-flex items-center gap-2">
                Inquire About Your Event
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            }
          ></Button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-stone-950 px-4 py-8 text-center sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex flex-col items-center justify-center gap-1 text-stone-500 sm:mb-6 sm:flex-row sm:gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="text-xs sm:text-sm">
              iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao
              City
            </span>
          </div>
          <Separator className="mb-4 bg-stone-800 sm:mb-6" />
          <p className="text-xs text-stone-600 sm:text-sm">
            Open 24/7 • Walk-ins welcome • Events by reservation
          </p>
        </div>
      </footer>
    </main>
  );
}
