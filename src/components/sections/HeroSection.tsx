import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero.png"
        alt="iHub Coworking Bistro"
        fill
        className="object-cover"
        priority
        quality={85}
        sizes="100vw"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-black/85" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h1 className="mb-5 font-serif text-4xl leading-[1.05] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-[5.25rem]">
          Work. Eat. Drink.
          <br />
          Play 24/7
        </h1>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg md:text-xl">
          Davao’s first coworking bistro hub.
          <br className="hidden sm:block" />
          Your space to create, connect, and celebrate — flexible work zones,
          good food, artisan coffee, and good vibes all in one community.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/booking?type=bistro"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-xl transition-all hover:bg-[#e05a00] active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg"
          >
            Reserve a Table
          </Link>

          <Link
            href="/booking?type=conference"
            className="inline-flex h-12 w-full max-w-xs items-center justify-center rounded-full border-2 border-white px-8 text-base font-semibold text-white transition-all hover:bg-white hover:text-black active:scale-95 sm:h-14 sm:w-auto sm:px-10 sm:text-lg"
          >
            Book Conference Room
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs tracking-widest text-white/60 sm:bottom-12 sm:text-sm">
        SCROLL TO EXPLORE
        <div className="mt-3 h-8 w-px bg-white/40 sm:h-10" />
      </div>
    </div>
  );
}
