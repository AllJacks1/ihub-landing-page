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
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden sm:min-h-140">
        <Image
          src="/images/bistroThumbnail.png"
          alt="iHub Coworking Space & Bistro"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-stone-900/75" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="mb-5 border-white/25 px-3 py-1 text-xs font-bold tracking-widest text-white/70 sm:mb-6 sm:px-4 sm:py-1.5"
          >
            ABOUT US
          </Badge>

          <h1 className="mb-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Where work, study, and life meet
          </h1>

          <p className="mx-auto mb-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
            iHub is Davao’s 24/7 productivity and lifestyle hub — one space that
            fits every part of your day.
          </p>

          <p className="font-serif text-lg italic text-white/50 sm:text-xl">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>

      {/* ===== INTRO ===== */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-5 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
            What is iHub?
          </h2>
          <p className="text-base leading-relaxed text-stone-600 sm:text-lg">
            It’s the place where you can work, study, meet clients, grab coffee
            or a meal, unwind with friends, catch live acoustic sets, and still
            feel completely at home. Not just desks and Wi‑Fi. Not just coffee
            and meals. The full experience — focused when you need it, relaxed
            when you want it.
          </p>
        </div>
      </section>

      {/* ===== THREE PILLARS ===== */}
      <section className="border-y border-stone-200 bg-white px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-3">
              The iHub experience
            </p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
              Work. Study. Unwind.
            </h2>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <Card
                key={pillar.title}
                className="border-stone-200 bg-stone-50 shadow-none transition-shadow hover:shadow-md"
              >
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#F36509]/10 sm:mb-5 sm:size-12">
                    <pillar.icon className="size-5 text-[#F36509] sm:size-6" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-semibold text-stone-900 sm:mb-3 sm:text-xl">
                    {pillar.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-stone-600 sm:text-[15px]">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SPACES ===== */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-3">
              Our spaces
            </p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
              Designed for how you actually spend your day
            </h2>
          </div>

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
            {spaces.map((space) => (
              <div
                key={space.name}
                className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:rounded-3xl"
              >
                <div className="border-b border-stone-100 bg-stone-50 px-6 py-5 sm:px-8 sm:py-7">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-[#F36509]/10 sm:mb-4 sm:size-11">
                    <space.icon className="size-4 text-[#F36509] sm:size-5" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                    {space.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-stone-500">
                    {space.tagline}
                  </p>
                </div>
                <ul className="flex-1 space-y-2.5 px-6 py-5 sm:space-y-3 sm:px-8 sm:py-7">
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

      {/* ===== WHY DIFFERENT ===== */}
      <section className="border-y border-stone-200 bg-stone-900 px-4 py-14 text-white sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-3">
            Why iHub
          </p>
          <h2 className="mb-5 font-serif text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            Not a regular café. Not a regular coworking space.
          </h2>
          <p className="text-base leading-relaxed text-white/75 sm:text-lg">
            We’re the full experience: focused work when you need it, quiet
            study when you need it, good food and drinks when you want them, and
            a relaxed vibe for evenings and weekends. Work when you need to.
            Study when you need to. Unwind when you want to.
          </p>
        </div>
      </section>

      {/* ===== PERKS GRID ===== */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-12">
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
              Built for real productivity
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {perks.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm sm:p-6"
              >
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-[#F36509]/10 sm:mb-4 sm:size-11">
                  <perk.icon className="size-4 text-[#F36509] sm:size-5" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-stone-900 sm:mb-1.5 sm:text-base">
                  {perk.title}
                </h3>
                <p className="text-xs leading-relaxed text-stone-500 sm:text-sm">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LOCATION ===== */}
      <section className="border-t border-stone-200 bg-white px-4 py-14 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-3">
              Location & hours
            </p>
            <h2 className="mb-4 font-serif text-2xl font-semibold tracking-tight text-stone-900 sm:mb-5 sm:text-3xl md:text-4xl">
              Find us in Davao City
            </h2>
            <p className="mb-5 text-sm leading-relaxed text-stone-600 sm:mb-6 sm:text-[15px]">
              You’ll also find us at{" "}
              <strong className="font-semibold text-stone-800">
                OneHub / iHub Xpress
              </strong>{" "}
              — Door 3, VC Magno Compound, Quimpo Boulevard — part of a broader
              business and lifestyle ecosystem (insurance, real estate, car
              rental, legal, document processing, and more). One stop. Multiple
              solutions.
            </p>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 sm:px-4 sm:py-2 sm:text-sm">
                <Clock className="size-3.5 text-[#F36509] sm:size-4" />
                Open 24/7
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-700 sm:px-4 sm:py-2 sm:text-sm">
                <MapPin className="size-3.5 text-[#F36509] sm:size-4" />
                Davao City
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 sm:rounded-3xl sm:p-8 md:p-10">
            <h3 className="mb-3 font-serif text-lg font-semibold text-stone-900 sm:mb-4 sm:text-xl">
              Visit or get in touch
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-stone-600 sm:mb-6">
              Come by, grab a coffee, and see the space for yourself — or call
              us and we’ll help you find the right pass, spot, or plan for your
              day.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 rounded-full bg-[#F36509] px-5 text-sm font-semibold text-white hover:bg-[#e05a00] sm:h-12 sm:px-6"
                render={
                  <Link href="/booking" className="inline-flex items-center">
                    Reserve a space
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                }
              ></Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-full border-stone-200 px-5 text-sm font-semibold text-stone-700 hover:border-[#F36509]/40 hover:bg-[#FFF4ED] hover:text-[#F36509] sm:h-12 sm:px-6"
                render={
                  <a
                    href="tel:09855713768"
                    className="inline-flex items-center"
                  >
                    <Phone className="mr-2 size-4" />
                    0985 571 3768
                  </a>
                }
              ></Button>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-stone-200" />

      {/* ===== CLOSING TAGLINE ===== */}
      <section className="bg-stone-50 px-4 py-12 text-center sm:px-6 sm:py-16">
        <p className="font-serif text-xl italic tracking-tight text-stone-400 sm:text-2xl md:text-3xl">
          Create your future. Celebrate your now.
        </p>
        <p className="mt-2 text-xs text-stone-500 sm:mt-3 sm:text-sm">
          See you at iHub.
        </p>
      </section>
    </main>
  );
}
