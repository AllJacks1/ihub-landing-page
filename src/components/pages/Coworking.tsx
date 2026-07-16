import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
      {/* Hero */}
      <section className="relative flex min-h-[680px] items-center justify-center overflow-hidden">
        <Image
          src="/images/coworking_hero.png"
          alt="iHub Coworking Space"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/60 to-stone-900/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-stone-600 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-400"
          >
            iWORK • COWORKING SPACE
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-white md:text-7xl">
            Work Better.
            <br />
            Focus Deeper.
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-200">
            24/7 high-speed coworking space in Davao with fast dual ISP
            internet, quiet zones, and a productive community.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-14 rounded-full bg-[#F36509] px-10 text-base font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
            >
              <Link href="/reserve" className="inline-flex items-center gap-2">
                Get iWork Pass
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-2 border-white/30 bg-white/10 px-10 text-base font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white hover:bg-white/20"
            >
              <Link href="/coworking/plans">View All Plans</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              Why Freelancers & Students Choose iHub
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Everything you need to do your best work, all in one place.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card
                key={benefit.title}
                className="border-stone-200 bg-white text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader className="pb-2 pt-10">
                  <div
                    className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ${benefit.color}`}
                  >
                    <benefit.icon className={`h-8 w-8 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-stone-900">
                    {benefit.title}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-stone-500">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Passes Section */}
      <section id="passes" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <Badge
              variant="outline"
              className="mb-4 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
            >
              MEMBERSHIP PLANS
            </Badge>
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              Choose Your Plan
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Flexible options for every type of worker.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
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
                  <div className="absolute right-4 top-4">
                    <Badge className="bg-[#F36509] text-xs font-bold text-white hover:bg-[#F36509]">
                      <Star className="mr-1 h-3 w-3 fill-white" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8 pt-10">
                  <div className="mb-2 font-mono text-xs font-bold tracking-widest text-[#F36509]">
                    {plan.tag}
                  </div>

                  <h3 className="mb-2 font-serif text-3xl font-semibold tracking-tighter text-stone-900">
                    {plan.name}
                  </h3>

                  <div className="mb-1 text-4xl font-bold text-stone-900">
                    {plan.price}
                  </div>
                  <div className="mb-6 text-sm text-stone-400">
                    {plan.period}
                  </div>

                  <p className="mb-6 text-sm text-stone-500">
                    {plan.description}
                  </p>

                  {/* Study tiers */}
                  {plan.tiers && (
                    <div className="mb-6 space-y-2 rounded-xl bg-stone-50 p-4">
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

                  <ul className="mb-8 space-y-3">
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
                    className={`h-12 w-full rounded-full text-sm font-semibold transition-all ${
                      plan.variant === "featured"
                        ? "bg-[#F36509] text-white shadow-lg shadow-orange-500/20 hover:bg-[#e05a00]"
                        : plan.variant === "highlighted"
                          ? "border-2 border-[#F36509] bg-transparent text-[#F36509] hover:bg-[#F36509] hover:text-white"
                          : "border-2 border-stone-900 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-white"
                    }`}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          <div>
            <Badge
              variant="outline"
              className="mb-4 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
            >
              AMENITIES
            </Badge>

            <h2 className="mb-10 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              Built for Productivity
            </h2>

            <div className="space-y-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F36509]/10">
                    <feature.icon className="h-6 w-6 text-[#F36509]" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-semibold text-stone-900">
                      {feature.title}
                    </h4>
                    <p className="leading-relaxed text-stone-500">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-stone-200 shadow-2xl">
            <Image
              src="/images/coworking-space.png"
              alt="iHub Coworking Interior"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-stone-900 px-6 py-28">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#F36509]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/20">
            <Sparkles className="h-7 w-7 text-[#F36509]" />
          </div>

          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-white">
            Ready to get more done?
          </h2>

          <p className="mb-10 text-xl leading-relaxed text-stone-400">
            Join the most productive community in Davao.
          </p>

          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-12 text-lg font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
          >
            <Link href="/reserve" className="inline-flex items-center gap-2">
              Start Today — ₱2,500/month
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
