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
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Content */}
          <div className="order-2 md:order-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1.5 text-xs font-medium text-[#F36509] sm:px-4 sm:text-sm">
              <Coffee className="h-4 w-4" />
              Bistro & Café
            </div>

            <h2 className="mb-5 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
              Coffee. Meals.
              <br />
              Good Vibes.
            </h2>

            <p className="mb-8 max-w-lg text-base leading-relaxed text-stone-500 sm:mb-10 sm:text-lg md:text-xl">
              Fuel your productivity with artisan coffee, hearty meals, snacks,
              and refreshing drinks — available 24/7.
            </p>

            <div className="mb-8 flex flex-wrap gap-2 sm:mb-10 sm:gap-3">
              {tags.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="secondary"
                  className="border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm transition-colors hover:border-[#F36509]/30 hover:text-[#F36509] sm:px-5 sm:py-2.5 sm:text-sm"
                >
                  <tag.icon className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  {tag.label}
                </Badge>
              ))}
            </div>

            <Link
              href="/bistro"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-[#F36509] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30 sm:h-14 sm:px-8 sm:text-base"
            >
              Explore Menu
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
            </Link>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2">
            <div className="group relative aspect-4/5 overflow-hidden rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 sm:aspect-16/20 sm:rounded-3xl">
              <Image
                src="/images/food.png"
                alt="iHub Café - Artisan coffee and hearty meals"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/30 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                <div className="flex items-center gap-2.5 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F36509]/10 sm:h-10 sm:w-10">
                    <Coffee className="h-4 w-4 text-[#F36509] sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <div className="text-base font-bold text-stone-900 sm:text-lg">
                      24/7
                    </div>
                    <div className="text-[10px] text-stone-500 sm:text-xs">
                      Kitchen Open
                    </div>
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
