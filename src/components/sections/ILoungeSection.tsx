import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  ArrowRight,
  Wifi,
  Coffee,
  Armchair,
  Droplets,
} from "lucide-react";

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
    <section className="relative overflow-hidden bg-stone-50 px-6 py-24">

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
        {/* Content */}
        <div className="order-2 md:order-1">
          <Badge
            variant="secondary"
            className="mb-6 bg-[#F36509]/10 px-5 py-2 text-sm font-bold tracking-widest text-[#F36509] hover:bg-[#F36509]/10"
          >
            NOW AVAILABLE FOR FREE
          </Badge>

          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
            Meet iLounge
          </h2>

          <p className="mb-10 text-2xl leading-relaxed text-stone-500">
            Your new favorite open collaborative space. No hourly rental fee —
            just enjoy something from our café.
          </p>

          <ul className="mb-12 space-y-5">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F36509]/10">
                  <feature.icon className="h-4 w-4 text-[#F36509]" />
                </div>
                <span className="text-lg text-stone-600">{feature.text}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-10 text-lg font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30"
          >
            <Link href="/reserve" className="inline-flex items-center gap-2">
              Visit iLounge Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Image */}
        <div className="order-1 md:order-2">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 shadow-2xl shadow-stone-900/10">
            <Image
              src="/images/iLounge.png"
              alt="iLounge at iHub - Open collaborative coworking space"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 via-transparent to-transparent" />

            {/* Floating badge on image */}
            <div className="absolute bottom-6 left-6">
              <div className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-stone-900 shadow-lg backdrop-blur-sm">
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
