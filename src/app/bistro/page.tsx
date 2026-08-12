"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, MapPin, Clock, Star, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";

const highlights = [
  {
    title: "New Pasta Lineup",
    description:
      "Rich, hearty, and full of flavor. Perfect for long work sessions or sharing with friends.",
    price: "₱229",
    image: "/images/pasta_lineup.png",
  },
  {
    title: "All-Day Silog Meals",
    description:
      "Tapsilog, Longsilog, Chicksilog & more — available anytime you need a hearty meal.",
    price: "₱219",
    image: "/images/bangsilog.png",
    isPopular: true,
  },
  {
    title: "Artisan Coffee & Drinks",
    description:
      "Freshly brewed coffee, specialty drinks, and refreshing beverages to keep you focused.",
    price: "₱80 - ₱250",
    image: "/images/artisan_drinks.png",
  },
];

export default function BistroPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden sm:min-h-170">
        <Image
          src="/images/bistro_hero.png"
          alt="iHub Bistro - Good food, great vibes"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-stone-900/75 via-stone-900/55 to-stone-900/85" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge className="mb-5 bg-[#F36509] px-4 py-1.5 text-xs font-bold tracking-widest text-white hover:bg-[#F36509] sm:mb-6 sm:px-6 sm:py-2 sm:text-sm">
            iEat • iHub Bistro
          </Badge>

          <h1 className="mb-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Good Food.
            <br />
            Great Vibes.
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-200 sm:text-lg md:text-xl">
            24/7 comfort food, Filipino classics, and new favorites — crafted to
            fuel your work, study, and celebrations.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="h-12 w-full max-w-xs cursor-pointer rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              onClick={() => router.push("/booking?type=bistro")}
            >
              Reserve a Table
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full max-w-xs cursor-pointer rounded-full border-2 border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/20 sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              onClick={() =>
                window.open(
                  "https://online.fliphtml5.com/mtvla/uhye/",
                  "_blank",
                )
              }
            >
              Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FEATURED DISH - BANGSILOG ===== */}
      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Content */}
          <div className="order-2 md:order-1">
            <div className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-4 sm:text-sm">
              Signature Breakfast
            </div>

            <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Bangsilog
            </h2>

            <p className="mb-5 text-lg font-medium leading-relaxed text-stone-700 sm:mb-6 sm:text-xl md:text-2xl">
              𝐘𝐮𝐧𝐠 𝐚𝐦𝐨𝐲 𝐩𝐚 𝐥𝐚𝐧𝐠, 𝐠𝐮𝐭𝐨𝐦 𝐤𝐚 𝐧𝐚 𝐚𝐠𝐚𝐝.
            </p>

            <p className="mb-4 text-base leading-relaxed text-stone-500 sm:text-lg">
              Imagine the irresistible aroma of perfectly grilled bangus, tender
              meat seasoned just right. Paired with a golden sunnyside-up egg
              and steaming, fluffy white rice. Each bite melts in your mouth.
            </p>

            <p className="mb-8 text-base leading-relaxed text-stone-500 sm:mb-10 sm:text-lg">
              A classic Filipino breakfast that feels like home on a plate.
              Simple, savory, and utterly satisfying — your mornings will never
              be the same.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <span className="text-3xl font-bold text-[#F36509] sm:text-4xl">
                ₱219
              </span>
              <Button
                size="lg"
                className="h-12 rounded-full bg-[#F36509] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:px-8 sm:text-base"
                render={
                  <Link
                    href="/booking?type=bistro"
                    className="inline-flex items-center gap-2"
                  >
                    <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5" />
                    Order Now
                  </Link>
                }
              ></Button>
            </div>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="group relative aspect-square overflow-hidden rounded-2xl border border-stone-200 shadow-2xl sm:rounded-3xl">
              <Image
                src="/images/bangsilog.png"
                alt="Bangsilog at iHub Bistro"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO SECTION ===== */}
      <section className="bg-stone-900 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Badge
            variant="outline"
            className="mb-3 border-stone-600 px-3 py-1 text-xs font-bold tracking-widest text-stone-400 sm:mb-4 sm:px-4 sm:py-1.5"
          >
            TAKE A TOUR
          </Badge>

          <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-white sm:text-4xl md:text-5xl">
            See the Bistro in Action
          </h2>

          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-stone-400 sm:mb-12 sm:text-lg">
            From sizzling pans to latte art — experience the energy of iHub
            Bistro.
          </p>

          {/* Video */}
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-stone-700 bg-stone-800 shadow-2xl sm:rounded-3xl">
            <video
              controls
              playsInline
              poster="/images/bistroThumbnail.png"
              className="h-full w-full object-cover"
            >
              <source src="/videos/bistro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 sm:mt-10 sm:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F36509]/20 sm:h-12 sm:w-12 sm:rounded-2xl">
                <Clock className="h-5 w-5 text-[#F36509] sm:h-6 sm:w-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white sm:text-lg">
                  24/7
                </div>
                <div className="text-xs text-stone-400 sm:text-sm">
                  Kitchen Open
                </div>
              </div>
            </div>

            <Separator
              orientation="vertical"
              className="hidden h-12 bg-stone-700 sm:block"
            />

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F36509]/20 sm:h-12 sm:w-12 sm:rounded-2xl">
                <MapPin className="h-5 w-5 text-[#F36509] sm:h-6 sm:w-6" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white sm:text-lg">
                  Davao City
                </div>
                <div className="text-xs text-stone-400 sm:text-sm">
                  Bajada, Pioneer Drive
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MENU HIGHLIGHTS ===== */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
              More from the Kitchen
            </h2>
            <p className="mx-auto max-w-xl text-base text-stone-500 sm:text-lg md:text-xl">
              Handpicked favorites from our menu, ready to order.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="group cursor-pointer overflow-hidden border-stone-200 bg-white pt-0 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/5"
              >
                <div className="relative aspect-video overflow-hidden bg-stone-200">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-stone-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {item.isPopular && (
                    <Badge className="absolute left-3 top-3 border-0 bg-[#F36509] text-xs font-bold text-white shadow-lg">
                      <Star className="mr-1 h-3 w-3 fill-white" />
                      Popular
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5 sm:p-6">
                  <h3 className="mb-2 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                    {item.title}
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-stone-500 sm:mb-4">
                    {item.description}
                  </p>
                  <div className="text-base font-bold text-[#F36509] sm:text-lg">
                    {item.price}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative overflow-hidden bg-stone-950 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#F36509]/10 blur-3xl sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Craving something?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-stone-400 sm:mb-12 sm:text-lg md:text-xl">
            Whether you&apos;re powering through work or chilling with friends,
            our kitchen is open 24/7.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="h-12 w-full max-w-xs rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              onClick={() => router.push("/booking?type=bistro")}
            >
              Reserve a Table
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full max-w-xs rounded-full border-2 border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/20 sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              onClick={() =>
                window.open(
                  "https://online.fliphtml5.com/mtvla/uhye/",
                  "_blank",
                )
              }
            >
              Full Menu
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <div className="bg-stone-950 px-4 py-8 text-center sm:px-6 sm:py-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-stone-600 sm:text-sm">
            Open 24/7 • Walk-ins welcome • Reservations recommended
          </p>
        </div>
      </div>
    </main>
  );
}
