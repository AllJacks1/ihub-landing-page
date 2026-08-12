import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[#F36509] px-4 py-20 sm:px-6 sm:py-28 md:py-32">
      {/* Decorative noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating shapes */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-white/10 blur-3xl sm:h-80 sm:w-80" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm sm:mb-8 sm:h-16 sm:w-16 sm:rounded-2xl">
          <Sparkles className="h-6 w-6 text-white sm:h-8 sm:w-8" />
        </div>

        <h2 className="mb-5 font-serif text-3xl font-semibold tracking-tighter text-white sm:text-4xl md:text-5xl lg:text-7xl">
          Ready to create
          <br />
          and celebrate?
        </h2>

        <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed text-white/80 sm:mb-12 sm:text-lg md:text-xl">
          Join Davao&apos;s most vibrant coworking community. Your desk, your
          coffee, your vibe — waiting for you.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Button
            size="lg"
            className="h-12 w-full max-w-xs rounded-full bg-white px-8 text-base font-bold text-[#F36509] shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:bg-white/90 sm:h-14 sm:w-auto sm:px-10 sm:text-lg md:h-16 md:px-12"
            render={
              <Link
                href="/booking?type=bistro"
                className="inline-flex items-center gap-2"
              >
                Reserve a Table
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            }
          ></Button>

          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full max-w-xs rounded-full border-2 border-white/40 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white hover:bg-white hover:text-[#F36509] sm:h-14 sm:w-auto sm:px-10 sm:text-lg md:h-16 md:px-12"
            render={<Link href="/booking?type=conference">Book a Space</Link>}
          ></Button>
        </div>
      </div>
    </section>
  );
}
