import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative h-screen min-h-[680px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero.png"
        alt="iHub Coworking Bistro"
        fill
        className="object-cover"
        priority
        quality={85}
      />

      {/* Stronger Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/85" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <h1 className="font-serif text-6xl md:text-7xl lg:text-[5.5rem] tracking-tighter text-white mb-6 leading-none">
          Work. Eat. Drink.
          <br />
          Play 24/7
        </h1>

        <p className="text-lg md:text-xl text-white/95 mb-10 max-w-2xl mx-auto leading-relaxed">
          Davao’s first coworking bistro hub.
          <br />
          Your space to create, connect, and celebrate — flexible work zones, 
          good food, artisan coffee, and good vibes all in one community.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/reserve/table"
            className="px-10 py-4 bg-[#F36509] hover:bg-[#e05a00] text-white text-lg font-semibold rounded-full transition-all active:scale-95 shadow-xl"
          >
            Reserve a Table
          </Link>

          <Link
            href="/reserve/conference"
            className="px-10 py-4 border-2 border-white text-white hover:bg-white hover:text-black text-lg font-semibold rounded-full transition-all active:scale-95"
          >
            Book Conference Room
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/70 flex flex-col items-center text-sm tracking-widest">
        SCROLL TO EXPLORE
        <div className="w-px h-10 bg-white/40 mt-3" />
      </div>
    </div>
  );
}