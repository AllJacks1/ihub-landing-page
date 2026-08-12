import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";

const features = [
  {
    image: "/images/iWork.png",
    imageAlt: "iWork coworking space",
    title: "iWork",
    description:
      "High-speed internet (up to 600 Mbps), ergonomic spaces, and 24/7 access for freelancers, remote workers, and builders.",
    cta: "Try iWork Pass ₱2,500",
    href: "/reserve",
  },
  {
    image: "/images/iStudy.png",
    imageAlt: "iStudy quiet zone",
    title: "iStudy",
    description:
      "Quiet zones, all-day passes, and a focused environment to help you succeed tomorrow.",
    cta: "Reserve Study Space",
    href: "/reserve",
  },
  {
    image: "/images/iPlay.png",
    imageAlt: "iPlay live music",
    title: "iPlay",
    description:
      "Live acoustic music, weekend vibes, games, drinks, and unforgettable conversations.",
    cta: "Join the Vibe Tonight",
    href: "#events",
  },
  {
    image: "/images/iEat.png",
    imageAlt: "iEat food and drinks",
    title: "iEat",
    description:
      "Comfort food, new pasta lineup, snacks, and hearty meals to fuel your day.",
    cta: "Explore the Menu",
    href: "#events",
  },
  {
    image: "/images/iDrink.png",
    imageAlt: "iDrink signature cocktails",
    title: "iDrink",
    description:
      "Unwind with friends. Games, signature drinks, live music, and weekend energy.",
    cta: "End your week at iHub",
    href: "#events",
  },
];

export default function WhySection() {
  return (
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-16">
          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-[#F36509] sm:text-4xl md:text-5xl lg:text-6xl">
            Create your future.
            <br />
            Celebrate your now.
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-500 sm:text-lg md:text-xl">
            Davao&apos;s first 24/7 coworking bistro hub. Where work meets good
            food, great coffee, and even better company.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group overflow-hidden border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F36509]/30 hover:shadow-lg hover:shadow-orange-500/5 pt-0"
            >
              <div className="relative h-48 w-full overflow-hidden bg-stone-100 sm:h-56">
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              <CardHeader className="px-5 pt-5 pb-2 sm:px-6 sm:pt-6">
                <h3 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
                  {feature.title}
                </h3>
              </CardHeader>

              <CardContent className="space-y-5 px-5 pb-6 sm:space-y-6 sm:px-6 sm:pb-8 ">
                <p className="text-base leading-relaxed text-stone-500 sm:text-lg">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="group/link inline-flex min-h-11 items-center gap-2 font-medium text-[#F36509] transition-colors hover:text-orange-700"
                >
                  {feature.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
