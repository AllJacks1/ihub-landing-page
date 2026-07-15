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
  Clock,
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
      {/* Hero */}
      <section className="relative flex min-h-[680px] items-center justify-center overflow-hidden">
        <Image
          src="/images/events-hero.png"
          alt="iHub Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/60 to-stone-900/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-stone-600 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-400"
          >
            iPLAY • iHub Events
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-white md:text-7xl">
            Events at iHub
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-200">
            Where good vibes, great people, and unforgettable moments come
            together.
          </p>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm font-bold tracking-widest text-[#F36509]">
            <Sparkles className="h-4 w-4" />
            CREATE YOUR FUTURE. CELEBRATE YOUR NOW.
          </div>
        </div>
      </section>

      {/* Past Highlights */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              Past Highlights
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Memories we made together. Join us for the next one.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
              <Card
                key={i}
                className="group overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/5 pt-0"
              >
                {/* Image - optimized for 2048x2048 source */}
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-200">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={85}
                    priority={i < 3} // prioritize first 3 images
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    // Optional: add blur placeholder if you have a tiny version
                    // placeholder="blur"
                    // blurDataURL={event.blurDataURL}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {/* Tag */}
                  <Badge className="absolute left-4 top-4 border-0 bg-white/95 text-xs font-bold text-stone-900 backdrop-blur-sm hover:bg-white">
                    <event.tagIcon className="mr-1.5 h-3 w-3 text-[#F36509]" />
                    {event.tag}
                  </Badge>

                  {/* Status badge */}
                  <Badge
                    className={`absolute right-4 top-4 border-0 text-xs font-bold ${
                      event.status === "Upcoming"
                        ? "bg-emerald-500 text-white"
                        : "bg-stone-800/80 text-stone-300"
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-6">
                  <h3 className="mb-3 font-serif text-2xl font-semibold leading-tight text-stone-900">
                    {event.title}
                  </h3>

                  <p className="mb-5 text-sm leading-relaxed text-stone-500">
                    {event.description}
                  </p>

                  {/* Meta */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Calendar className="h-4 w-4 text-[#F36509]" />
                      {event.date}
                    </div>

                    {/* {event.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-[#F36509]" />
                        <span className="font-semibold text-[#F36509]">
                          {event.price}
                        </span>
                        <span className="text-stone-400">• {event.note}</span>
                      </div>
                    )} */}

                    {event.highlight && (
                      <div className="flex items-center gap-2 text-sm font-medium text-[#F36509]">
                        <Star className="h-4 w-4 fill-[#F36509]" />
                        {event.highlight}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-stone-900 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: Calendar, label: "Events Hosted", value: "3" },
              { icon: Users, label: "Attendees", value: "100+" },
              { icon: Heart, label: "Connections Made", value: "100+" },
              { icon: Sparkles, label: "Prizes Given", value: "10+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/20">
                  <stat.icon className="h-6 w-6 text-[#F36509]" />
                </div>
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative overflow-hidden bg-stone-50 px-6 py-24">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F36509]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
            <Sparkles className="h-7 w-7 text-[#F36509]" />
          </div>

          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
            Want to host your next event at iHub?
          </h2>

          <p className="mb-10 text-xl leading-relaxed text-stone-500">
            From intimate gatherings to big celebrations — we&apos;ve got the
            space and vibes for it.
          </p>

          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
          >
            <Link href="/contact" className="inline-flex items-center gap-2">
              Inquire About Your Event
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 px-6 py-12 text-center">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-2 text-stone-500">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao
              City
            </span>
          </div>
          <Separator className="mb-6 bg-stone-800" />
          <p className="text-sm text-stone-600">
            Open 24/7 • Walk-ins welcome • Events by reservation
          </p>
        </div>
      </footer>
    </main>
  );
}
