import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Coffee, UtensilsCrossed, GlassWater, ArrowRight } from "lucide-react";
import Link from "next/link";

const tags = [
  { label: "New Pasta Lineup", icon: UtensilsCrossed },
  { label: "Comfort Food", icon: Coffee },
  { label: "Signature Drinks", icon: GlassWater },
];

export default function FoodDrinksSection() {
  return (
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-16 md:grid-cols-2">
          {/* Content */}
          <div className="order-2 md:order-1">
            {/* Section label */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 text-sm font-medium text-[#F36509]">
              <Coffee className="h-4 w-4" />
              Bistro & Café
            </div>

            <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
              Coffee. Meals.
              <br />
              Good Vibes.
            </h2>

            <p className="mb-10 max-w-lg text-xl leading-relaxed text-stone-500">
              Fuel your productivity with artisan coffee, hearty meals, snacks,
              and refreshing drinks — available 24/7.
            </p>

            {/* Tags */}
            <div className="mb-10 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="secondary"
                  className="border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-[#F36509]/30 hover:text-[#F36509]"
                >
                  <tag.icon className="mr-2 h-4 w-4" />
                  {tag.label}
                </Badge>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/bistro"
              className="group inline-flex items-center gap-2 rounded-full bg-[#F36509] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30"
            >
              Explore Menu
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="group relative aspect-16/20 overflow-hidden rounded-3xl border border-stone-200 shadow-2xl shadow-stone-900/10">
              <Image
                src="/images/food.png"
                alt="iHub Café - Artisan coffee and hearty meals"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/30 via-transparent to-transparent" />

              {/* Floating stat */}
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-3 shadow-lg backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F36509]/10">
                    <Coffee className="h-5 w-5 text-[#F36509]" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-stone-900">24/7</div>
                    <div className="text-xs text-stone-500">Kitchen Open</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
