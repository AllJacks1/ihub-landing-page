import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#F36509] px-6 py-32">
      {/* Decorative noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating shapes */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative mx-auto max-w-3xl text-center">
        {/* Sparkle icon */}
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-white md:text-7xl">
          Ready to create
          <br />
          and celebrate?
        </h2>

        <p className="mx-auto mb-12 max-w-lg text-xl leading-relaxed text-white/80">
          Join Davao&apos;s most vibrant coworking community. Your desk, your
          coffee, your vibe — waiting for you.
        </p>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            className="h-16 rounded-full bg-white px-12 text-lg font-bold text-[#F36509] shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-black/30 hover:text-white"
          >
            <Link
              href="/booking?type=bistro"
              className="inline-flex items-center gap-2"
            >
              Reserve a Table
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-16 rounded-full border-2 border-white/40 bg-white/10 px-12 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white hover:bg-white"
          >
            <Link href="/booking?type=conference">Book a Space</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
