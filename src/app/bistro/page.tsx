import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Play,
  MapPin,
  Clock,
  Star,
  UtensilsCrossed,
} from "lucide-react";

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
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[700px] items-center justify-center overflow-hidden">
        <Image
          src="/images/bistro_hero.png"
          alt="iHub Bistro - Good food, great vibes"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/80" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Badge className="mb-6 bg-[#F36509] px-6 py-2 text-sm font-bold tracking-widest text-white hover:bg-[#F36509]">
            iEat • iHub Bistro
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-white md:text-7xl">
            Good Food.
            <br />
            Great Vibes.
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-200">
            24/7 comfort food, Filipino classics, and new favorites — crafted to
            fuel your work, study, and celebrations.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-14 rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
            >
              <Link
                href="/reserve/table"
                className="inline-flex items-center gap-2"
              >
                Reserve a Table
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-2 border-white/30 bg-white/10 px-10 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/20"
            >
              <Link
                href="https://online.fliphtml5.com/mtvla/uhye/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full Menu
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Dish - Bangsilog */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <div className="mb-4 font-mono text-sm font-bold uppercase tracking-widest text-[#F36509]">
              Signature Breakfast
            </div>

            <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
              Bangsilog
            </h2>

            <p className="mb-6 text-2xl font-medium leading-relaxed text-stone-700">
              𝐘𝐮𝐧𝐠 𝐚𝐦𝐨𝐲 𝐩𝐚 𝐥𝐚𝐧𝐠, 𝐠𝐮𝐭𝐨𝐦 𝐤𝐚 𝐧𝐚 𝐚𝐠𝐚𝐝.
            </p>

            <p className="mb-4 text-lg leading-relaxed text-stone-500">
              Imagine the irresistible aroma of perfectly grilled bangus, tender
              meat seasoned just right. Paired with a golden sunnyside-up egg
              and steaming, fluffy white rice. Each bite melts in your mouth.
            </p>

            <p className="mb-10 text-lg leading-relaxed text-stone-500">
              A classic Filipino breakfast that feels like home on a plate.
              Simple, savory, and utterly satisfying — your mornings will never
              be the same.
            </p>

            <div className="flex items-center gap-6">
              <span className="text-4xl font-bold text-[#F36509]">₱219</span>
              <Button
                size="lg"
                className="h-14 rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
              >
                <Link
                  href="/reserve/table"
                  className="inline-flex items-center gap-2"
                >
                  <UtensilsCrossed className="h-5 w-5" />
                  Order Now
                </Link>
              </Button>
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="group relative aspect-square overflow-hidden rounded-3xl border border-stone-200 shadow-2xl">
              <Image
                src="/images/bangsilog.png"
                alt="Bangsilog at iHub Bistro"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="bg-stone-900 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <Badge
            variant="outline"
            className="mb-4 border-stone-600 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-400"
          >
            TAKE A TOUR
          </Badge>

          <h2 className="mb-4 font-serif text-4xl font-semibold tracking-tighter text-white md:text-5xl">
            See the Bistro in Action
          </h2>

          <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-stone-400">
            From sizzling pans to latte art — experience the energy of iHub
            Bistro.
          </p>

          {/* Video Container */}
          <div className="group relative aspect-video overflow-hidden rounded-3xl border border-stone-700 bg-stone-800 shadow-2xl">
            {/* Replace src with your actual video URL or embed */}
            <video
              controls
              poster="/images/bistroThumbnail.png"
              className="h-full w-full object-cover"
            >
              <source src="/videos/bistro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Fallback: YouTube Embed (uncomment if using YouTube) */}
            {/*
            <iframe
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID?rel=0"
              title="iHub Bistro Tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full rounded-3xl"
            />
            */}
          </div>

          {/* Video stats */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/20">
                <Clock className="h-6 w-6 text-[#F36509]" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-white">24/7</div>
                <div className="text-sm text-stone-400">Kitchen Open</div>
              </div>
            </div>
            <Separator
              orientation="vertical"
              className="hidden h-12 bg-stone-700 sm:block"
            />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/20">
                <MapPin className="h-6 w-6 text-[#F36509]" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-white">Davao City</div>
                <div className="text-sm text-stone-400">
                  Bajada, Pioneer Drive
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              More from the Kitchen
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Handpicked favorites from our menu, ready to order.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="group cursor-pointer overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-900/5 pt-0"
              >
                <div className="relative aspect-video overflow-hidden bg-stone-200">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  {item.isPopular && (
                    <Badge className="absolute left-3 top-3 border-0 bg-[#F36509] text-xs font-bold text-white shadow-lg">
                      <Star className="mr-1 h-3 w-3 fill-white" />
                      Popular
                    </Badge>
                  )}
                </div>

                <CardContent className="p-6">
                  <h3 className="mb-2 font-serif text-2xl font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-stone-500">
                    {item.description}
                  </p>
                  <div className="text-lg font-bold text-[#F36509]">
                    {item.price}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-stone-950 px-6 py-18">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F36509]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-white">
            Craving something?
          </h2>
          <p className="mb-12 text-xl leading-relaxed text-stone-400">
            Whether you&apos;re powering through work or chilling with friends,
            our kitchen is open 24/7.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-14 rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
            >
              <Link
                href="/reserve/table"
                className="inline-flex items-center gap-2"
              >
                Reserve a Table
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-2 border-white/20 px-10 text-base font-semibold text-mist-900 transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/30"
            >
              <Link
                href="https://online.fliphtml5.com/mtvla/uhye/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Full Menu
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="bg-stone-950 px-6 py-12 text-center">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-stone-600">
            Open 24/7 • Walk-ins welcome • Reservations recommended
          </p>
        </div>
      </div>
    </main>
  );
}
