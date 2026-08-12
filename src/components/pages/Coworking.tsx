import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ArrowRight,
  Zap,
  MapPin,
  Coffee,
  Wifi,
  Armchair,
  Clock,
  Check,
  Star,
  Users,
  Sparkles,
} from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Lightning Fast Internet",
    description:
      "Up to 600 Mbps with Dual ISP backup. No lags. No excuses. Stay productive 24/7.",
    color: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: MapPin,
    title: "Quiet & Comfortable Zones",
    description:
      "Dedicated study areas and collaborative spaces designed for deep focus and creativity.",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Coffee,
    title: "Fuel On Demand",
    description:
      "Coffee, meals, and snacks available 24/7 right where you work.",
    color: "bg-orange-50",
    iconColor: "text-[#F36509]",
  },
];

const plans = [
  {
    id: "iwork",
    tag: "FOR FREELANCERS & REMOTE WORKERS",
    name: "iWork Monthly",
    price: "₱2,500",
    period: "per month",
    description: "Unlimited access for serious professionals.",
    features: [
      "24/7 Coworking Access",
      "Up to 600 Mbps Dual ISP",
      "Access to all work zones",
      "High-speed, distraction-free environment",
      "Free coffee refills",
    ],
    cta: "Get iWork Pass",
    href: "/reserve",
    variant: "featured" as const,
  },
  {
    id: "study",
    tag: "FOR STUDENTS & FOCUS WORK",
    name: "Study Packages",
    price: "From ₱450",
    period: "flexible hours",
    description: "Quiet zones perfect for exam week and daily sessions.",
    features: [
      "Quiet study areas",
      "Up to 600 Mbps WiFi",
      "Hourly or monthly options",
      "Air-conditioned spaces",
      "Charging stations",
    ],
    tiers: [
      { hours: "10 Hours", price: "₱450" },
      { hours: "20 Hours", price: "₱800" },
      { hours: "Monthly", price: "₱2,000" },
    ],
    cta: "Reserve Study Space",
    href: "/reserve",
    variant: "default" as const,
  },
  {
    id: "iaccess",
    tag: "LOYALTY MEMBERSHIP",
    name: "iAccess",
    price: "Rewards",
    period: "across all zones",
    description: "Earn rewards while you create. The ultimate iHub experience.",
    features: [
      "iWork, iStudy, iLounge, iEat & iDrink",
      "Priority access & member perks",
      "Build your productivity community",
      "Exclusive member events",
      "Discounts on café & conference rooms",
    ],
    cta: "Join iAccess",
    href: "/reserve",
    variant: "highlighted" as const,
    badge: "BEST VALUE",
  },
];

const features = [
  {
    icon: Wifi,
    title: "High-Speed Internet",
    description:
      "Dual ISP connection up to 600 Mbps — reliable even during peak hours.",
  },
  {
    icon: Armchair,
    title: "Ergonomic & Quiet Zones",
    description:
      "Dedicated areas for deep focus, meetings, or collaborative work.",
  },
  {
    icon: Clock,
    title: "Open 24/7",
    description: "Work on your own schedule — day or night.",
  },
  {
    icon: Users,
    title: "Productive Community",
    description:
      "Connect with freelancers, students, and professionals in Davao.",
  },
];

export default function CoworkingPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden sm:min-h-170">
        <Image
          src="/images/coworking_hero.png"
          alt="iHub Coworking Space"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-linear-to-b from-stone-900/80 via-stone-900/60 to-stone-900/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="mb-5 border-stone-600 px-3 py-1 text-xs font-bold tracking-widest text-stone-400 sm:mb-6 sm:px-4 sm:py-1.5"
          >
            iWORK • COWORKING SPACE
          </Badge>

          <h1 className="mb-5 font-serif text-4xl font-semibold leading-[1.05] tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Work Better.
            <br />
            Focus Deeper.
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-200 sm:text-lg md:text-xl">
            24/7 high-speed coworking space in Davao with fast dual ISP
            internet, quiet zones, and a productive community.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
            <Button
              size="lg"
              className="h-12 w-full max-w-xs rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              render={
                <Link
                  href="/reserve"
                  className="inline-flex items-center gap-2"
                >
                  Get iWork Pass
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              }
            ></Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full max-w-xs rounded-full border-2 border-white/30 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/20 sm:h-14 sm:w-auto sm:px-10 sm:text-base"
              render={<Link href="/coworking/plans">View All Plans</Link>}
            ></Button>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
              Why Freelancers & Students Choose iHub
            </h2>
            <p className="mx-auto max-w-xl text-base text-stone-500 sm:text-lg md:text-xl">
              Everything you need to do your best work, all in one place.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="border-stone-200 bg-white text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="pb-2 pt-8 sm:pt-10">
                  <div
                    className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl sm:mb-6 sm:h-16 sm:w-16 ${benefit.color}`}
                  >
                    <benefit.icon
                      className={`h-7 w-7 sm:h-8 sm:w-8 ${benefit.iconColor}`}
                    />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                    {benefit.title}
                  </h3>
                </CardHeader>
                <CardContent className="px-5 pb-8 sm:px-6">
                  <p className="text-sm leading-relaxed text-stone-500 sm:text-base">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PASSES / PLANS ===== */}
      <section
        id="passes"
        className="bg-white px-4 py-16 sm:px-6 sm:py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:mb-16">
            <Badge
              variant="outline"
              className="mb-3 border-stone-300 px-3 py-1 text-xs font-bold tracking-widest text-stone-500 sm:mb-4 sm:px-4 sm:py-1.5"
            >
              MEMBERSHIP PLANS
            </Badge>
            <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
              Choose Your Plan
            </h2>
            <p className="mx-auto max-w-xl text-base text-stone-500 sm:text-lg md:text-xl">
              Flexible options for every type of worker.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 ${
                  plan.variant === "featured"
                    ? "border-[#F36509]/30 bg-white shadow-xl shadow-orange-500/5 ring-1 ring-[#F36509]/20"
                    : plan.variant === "highlighted"
                      ? "border-stone-200 bg-white shadow-lg"
                      : "border-stone-200 bg-white shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                    <Badge className="bg-[#F36509] text-xs font-bold text-white hover:bg-[#F36509]">
                      <Star className="mr-1 h-3 w-3 fill-white" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 pt-8 sm:p-8 sm:pt-10">
                  <div className="mb-2 font-mono text-[10px] font-bold tracking-widest text-[#F36509] sm:text-xs">
                    {plan.tag}
                  </div>

                  <h3 className="mb-2 font-serif text-2xl font-semibold tracking-tighter text-stone-900 sm:text-3xl">
                    {plan.name}
                  </h3>

                  <div className="mb-1 text-3xl font-bold text-stone-900 sm:text-4xl">
                    {plan.price}
                  </div>
                  <div className="mb-5 text-xs text-stone-400 sm:mb-6 sm:text-sm">
                    {plan.period}
                  </div>

                  <p className="mb-5 text-sm text-stone-500 sm:mb-6">
                    {plan.description}
                  </p>

                  {/* Study tiers */}
                  {plan.tiers && (
                    <div className="mb-5 space-y-2 rounded-xl bg-stone-50 p-3 sm:mb-6 sm:p-4">
                      {plan.tiers.map((tier) => (
                        <div
                          key={tier.hours}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-stone-600">
                            {tier.hours}
                          </span>
                          <span className="font-bold text-[#F36509]">
                            {tier.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <ul className="mb-6 space-y-2.5 sm:mb-8 sm:space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F36509]/10">
                          <Check
                            className="h-3 w-3 text-[#F36509]"
                            strokeWidth={3}
                          />
                        </div>
                        <span className="text-sm text-stone-600">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`h-11 w-full rounded-full text-sm font-semibold transition-all sm:h-12 ${
                      plan.variant === "featured"
                        ? "bg-[#F36509] text-white shadow-lg shadow-orange-500/20 hover:bg-[#e05a00]"
                        : plan.variant === "highlighted"
                          ? "border-2 border-[#F36509] bg-transparent text-[#F36509] hover:bg-[#F36509] hover:text-white"
                          : "border-2 border-stone-900 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-white"
                    }`}
                    render={<Link href={plan.href}>{plan.cta}</Link>}
                  ></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES / AMENITIES ===== */}
      <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="order-2 md:order-1">
            <Badge
              variant="outline"
              className="mb-3 border-stone-300 px-3 py-1 text-xs font-bold tracking-widest text-stone-500 sm:mb-4 sm:px-4 sm:py-1.5"
            >
              AMENITIES
            </Badge>

            <h2 className="mb-8 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:mb-10 sm:text-4xl md:text-5xl">
              Built for Productivity
            </h2>

            <div className="space-y-6 sm:space-y-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4 sm:gap-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                    <feature.icon className="h-5 w-5 text-[#F36509] sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold text-stone-900 sm:text-lg">
                      {feature.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-stone-500 sm:text-base">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="group relative aspect-4/3 overflow-hidden rounded-2xl border border-stone-200 shadow-2xl sm:rounded-3xl">
              <Image
                src="/images/coworking-space.png"
                alt="iHub Coworking Interior"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/20 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative overflow-hidden bg-stone-900 px-4 py-16 sm:px-6 sm:py-20 md:py-28">
        <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#F36509]/10 blur-3xl sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F36509]/20 sm:mb-5 sm:h-14 sm:w-14 sm:rounded-2xl">
            <Sparkles className="h-6 w-6 text-[#F36509] sm:h-7 sm:w-7" />
          </div>

          <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-white sm:text-4xl md:text-5xl">
            Ready to get more done?
          </h2>

          <p className="mb-8 text-base leading-relaxed text-stone-400 sm:mb-10 sm:text-lg md:text-xl">
            Join the most productive community in Davao.
          </p>

          <Button
            size="lg"
            className="h-12 rounded-full bg-[#F36509] px-8 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:px-12 sm:text-base md:text-lg"
            render={
              <Link href="/reserve" className="inline-flex items-center gap-2">
                Start Today — ₱2,500/month
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            }
          ></Button>
        </div>
      </section>
    </main>
  );
}
