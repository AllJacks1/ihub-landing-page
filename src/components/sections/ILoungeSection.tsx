import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wifi, Coffee, Armchair, Droplets } from "lucide-react";

const features = [
  {
    icon: Wifi,
    text: "High-speed internet (up to 600 Mbps)",
  },
  {
    icon: Armchair,
    text: "Perfect for remote work, online classes, meetings & catch-ups",
  },
  {
    icon: Coffee,
    text: "Complimentary mineral water + full café menu 24/7",
  },
  {
    icon: Droplets,
    text: "Air-conditioned, charging stations, comfortable seating",
  },
];

export default function ILoungeSection() {
  return (
    <section className="relative overflow-hidden bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Content */}
        <div className="order-2 md:order-1">
          <Badge
            variant="secondary"
            className="mb-5 bg-[#F36509]/10 px-4 py-1.5 text-xs font-bold tracking-widest text-[#F36509] hover:bg-[#F36509]/10 sm:mb-6 sm:px-5 sm:py-2 sm:text-sm"
          >
            NOW AVAILABLE FOR FREE
          </Badge>

          <h2 className="mb-5 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Meet iLounge
          </h2>

          <p className="mb-8 text-lg leading-relaxed text-stone-500 sm:mb-10 sm:text-xl md:text-2xl">
            Your new favorite open collaborative space. No hourly rental fee —
            just enjoy something from our café.
          </p>

          <ul className="mb-10 space-y-4 sm:mb-12 sm:space-y-5">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F36509]/10 sm:h-9 sm:w-9">
                  <feature.icon className="h-4 w-4 text-[#F36509]" />
                </div>
                <span className="text-base text-stone-600 sm:text-lg">
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="h-12 rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30 sm:h-14 sm:px-10 sm:text-lg"
            render={
              <Link
                href="/booking?type=bistro"
                className="inline-flex items-center gap-2"
              >
                Visit iLounge Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            }
          ></Button>
        </div>

        {/* Image */}
        <div className="order-1 md:order-2">
          <div className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-stone-200 shadow-2xl shadow-stone-900/10 sm:rounded-3xl">
            <Image
              src="/images/iLounge.png"
              alt="iLounge at iHub - Open collaborative coworking space"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-stone-900/20 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <div className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-stone-900 shadow-lg backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Open 24/7
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
