"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Clock,
  Coffee,
  MapPin,
  Music,
  Phone,
  Users,
  UtensilsCrossed,
  Wifi,
  Zap,
} from "lucide-react";

const pillars = [
  {
    icon: BookOpen,
    title: "Work & Study",
    description:
      "Focused desks, reliable internet, and quiet zones when you need to get things done — or deep work without the distractions.",
  },
  {
    icon: Coffee,
    title: "Café & Bistro",
    description:
      "Coffee, meals, snacks, and comfort food around the clock. Good work starts with a good meal; the best conversations start at the table.",
  },
  {
    icon: Music,
    title: "Evenings & Community",
    description:
      "Live acoustic sets, games, good drinks, and relaxed Friday nights. Productivity by day, good company by night.",
  },
];

const spaces = [
  {
    icon: Users,
    name: "iLounge",
    tagline: "Open collaborative space",
    points: [
      "Work, study, online classes, or client meetings",
      "Fully air-conditioned & charging-friendly",
      "High-speed Wi-Fi up to 600 Mbps (dual ISP)",
      "Complimentary mineral water",
      "No hourly space fee — just order from the café",
    ],
  },
  {
    icon: Briefcase,
    name: "iWork",
    tagline: "Dedicated coworking",
    points: [
      "Built for freelancers and remote workers",
      "Reliable internet and a productive environment",
      "Stay as long as you need",
      "Workspace that works",
    ],
  },
  {
    icon: UtensilsCrossed,
    name: "iHub Bistro",
    tagline: "Food, coffee & drinks 24/7",
    points: [
      "Coffee, meals, snacks, and comfort food",
      "Come purely for the café — no work required",
      "Quiet break or evening with friends",
      "Always welcome",
    ],
  },
];

const perks = [
  {
    icon: Wifi,
    title: "Up to 600 Mbps",
    description: "Dual ISP for deadlines, classes, and client calls.",
  },
  {
    icon: Clock,
    title: "Open 24/7",
    description: "Early mornings, late nights — your schedule, your space.",
  },
  {
    icon: Zap,
    title: "Charging-friendly",
    description: "Power for your devices so productivity stays powered too.",
  },
  {
    icon: MapPin,
    title: "Davao City",
    description: "OneHub / iHub Xpress — Quimpo Boulevard and beyond.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden">
        <Image
          src="/images/bistroThumbnail.png"
          alt="iHub Coworking Space & Bistro"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-stone-900/75" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/25 px-4 py-1.5 text-xs font-bold tracking-widest text-white/70"
          >
            ABOUT US
          </Badge>

          <h1 className="mb-5 font-serif text-5xl font-semibold tracking-tighter text-white md:text-6xl lg:text-7xl">
            Where work, study, and life meet
          </h1>

          <p className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
            iHub is Davao’s 24/7 productivity and lifestyle hub — one space that
            fits every part of your day.
          </p>

          <p className="font-serif text-xl italic text-white/50">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            What is iHub?
          </h2>
          <p className="text-lg leading-relaxed text-stone-600">
            It’s the place where you can work, study, meet clients, grab coffee
            or a meal, unwind with friends, catch live acoustic sets, and still
            feel completely at home. Not just desks and Wi‑Fi. Not just coffee
            and meals. The full experience — focused when you need it, relaxed
            when you want it.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="border-y border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F36509]">
              The iHub experience
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Work. Study. Unwind.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-stone-200 bg-stone-50 shadow-none transition-shadow hover:shadow-md"
              >
                <CardContent className="p-8">
                  <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#F36509]/10">
                    <pillar.icon className="size-6 text-[#F36509]" />
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-semibold text-stone-900">
                    {pillar.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-stone-600">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Spaces */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F36509]">
              Our spaces
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Designed for how you actually spend your day
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {spaces.map((space) => (
              <div
                key={space.name}
                className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="border-b border-stone-100 bg-stone-50 px-8 py-7">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#F36509]/10">
                    <space.icon className="size-5 text-[#F36509]" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-stone-900">
                    {space.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    {space.tagline}
                  </p>
                </div>
                <ul className="flex-1 space-y-3 px-8 py-7">
                  {space.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm leading-relaxed text-stone-600"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#F36509]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why different */}
      <section className="border-y border-stone-200 bg-stone-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F36509]">
            Why iHub
          </p>
          <h2 className="mb-6 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Not a regular café. Not a regular coworking space.
          </h2>
          <p className="text-lg leading-relaxed text-white/75">
            We’re the full experience: focused work when you need it, quiet
            study when you need it, good food and drinks when you want them, and
            a relaxed vibe for evenings and weekends. Work when you need to.
            Study when you need to. Unwind when you want to.
          </p>
        </div>
      </section>

      {/* Perks grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Built for real productivity
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-[#F36509]/10">
                  <perk.icon className="size-5 text-[#F36509]" />
                </div>
                <h3 className="mb-1.5 font-semibold text-stone-900">
                  {perk.title}
                </h3>
                <p className="text-sm leading-relaxed text-stone-500">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#F36509]">
              Location & hours
            </p>
            <h2 className="mb-5 font-serif text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Find us in Davao City
            </h2>
            <p className="mb-6 text-[15px] leading-relaxed text-stone-600">
              You’ll also find us at{" "}
              <strong className="font-semibold text-stone-800">
                OneHub / iHub Xpress
              </strong>{" "}
              — Door 3, VC Magno Compound, Quimpo Boulevard — part of a broader
              business and lifestyle ecosystem (insurance, real estate, car
              rental, legal, document processing, and more). One stop. Multiple
              solutions.
            </p>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">
                <Clock className="size-4 text-[#F36509]" />
                Open 24/7
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700">
                <MapPin className="size-4 text-[#F36509]" />
                Davao City
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-stone-50 p-8 md:p-10">
            <h3 className="mb-4 font-serif text-xl font-semibold text-stone-900">
              Visit or get in touch
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-stone-600">
              Come by, grab a coffee, and see the space for yourself — or call
              us and we’ll help you find the right pass, spot, or plan for your
              day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#F36509] px-6 font-semibold text-white hover:bg-[#e05a00]"
                render={<Link href="/booking" />}
              >
                Reserve a space
                <ArrowRight className="ml-2 size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-full border-stone-200 px-6 font-semibold text-stone-700 hover:border-[#F36509]/40 hover:bg-[#FFF4ED] hover:text-[#F36509]"
                render={<a href="tel:09855713768" />}
              >
                <Phone className="mr-2 size-4" />
                0985 571 3768
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-stone-200" />

      {/* Closing tagline */}
      <section className="bg-stone-50 px-6 py-16 text-center">
        <p className="font-serif text-2xl italic tracking-tight text-stone-400 md:text-3xl">
          Create your future. Celebrate your now.
        </p>
        <p className="mt-3 text-sm text-stone-500">See you at iHub.</p>
      </section>
    </main>
  );
}
