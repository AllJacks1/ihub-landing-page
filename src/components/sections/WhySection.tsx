import Link from "next/link";
import Image from "next/image"; // ← Add this
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader } from "../ui/card";

const features = [
  {
    image: "/images/iWork.png", // ← Replace with your image paths
    imageAlt: "iWork coworking space",
    title: "iWork",
    description:
      "High-speed internet (up to 600 Mbps), ergonomic spaces, and 24/7 access for freelancers, remote workers, and builders.",
    cta: "Try iWork Pass ₱2,500",
    href: "/reserve",
    iconBg: "bg-orange-50", // You can keep this for a subtle background or remove it
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
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-[#F36509] md:text-6xl">
            Create your future.
            <br />
            Celebrate your now.
          </h2>
          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-500">
            Davao&apos;s first 24/7 coworking bistro hub. Where work meets good
            food, great coffee, and even better company.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group overflow-hidden border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#F36509]/30 hover:shadow-lg hover:shadow-orange-500/5"
            >
              {/* Full-width Top Image */}
              <div className="relative h-56 w-full overflow-hidden bg-stone-100 -mt-6">
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>

              <CardHeader className="px-6 pt-6 pb-2">
                <h3 className="font-serif text-3xl font-semibold text-stone-900">
                  {feature.title}
                </h3>
              </CardHeader>

              <CardContent className="px-6 space-y-6 pb-8">
                <p className="text-lg leading-relaxed text-stone-500">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="group/link inline-flex items-center gap-2 font-medium text-[#F36509] transition-colors hover:text-orange-700"
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
