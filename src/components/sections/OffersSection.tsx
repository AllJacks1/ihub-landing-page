import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap, Star } from "lucide-react";

const plans = [
  {
    name: "iWork",
    subtitle: "DAILY / MONTHLY",
    price: "₱2,500",
    period: "per month",
    description: "Flexible access for focused work sessions.",
    features: [
      "24/7 Coworking Access",
      "High-speed WiFi (up to 600 Mbps)",
      "Quiet & Collaborative Zones",
      "Perfect for freelancers & remote teams",
    ],
    cta: "Get iWork Pass",
    href: "/reserve",
    variant: "default" as const,
    icon: Zap,
  },
  {
    name: "iAccess",
    subtitle: "LOYALTY PROGRAM",
    price: "Rewards",
    period: "across all zones",
    description: "Study • Work • Play • Eat",
    features: [
      "Priority access & perks",
      "Earn rewards while you create",
      "Exclusive member events",
      "Discounts on café & conference rooms",
    ],
    cta: "Join iAccess",
    href: "/reserve",
    variant: "featured" as const,
    icon: Star,
    badge: "MOST POPULAR",
  },
];

export default function OffersSection() {
  return (
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-5xl text-center">
        {/* Header */}
        <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
          Choose Your Pass
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-xl leading-relaxed text-stone-500">
          Flexible access tailored for how you work, study, and connect.
        </p>

        {/* Cards */}
        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 ${
                plan.variant === "featured"
                  ? "border-[#F36509]/30 bg-white shadow-xl shadow-orange-500/5 hover:border-[#F36509]/50 hover:shadow-2xl hover:shadow-orange-500/10"
                  : "border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {plan.badge && (
                <div className="absolute -right-12 top-7 w-44 rotate-45 bg-[#F36509] py-1.5 text-center text-xs font-bold tracking-wider text-white shadow-sm">
                  {plan.badge}
                </div>
              )}

              <CardHeader className="pb-4 pt-10">
                {/* Subtitle */}
                <div className="mb-3 font-mono text-xs font-bold tracking-[3px] text-[#F36509]">
                  {plan.subtitle}
                </div>

                {/* Plan Name */}
                <div className="mb-2 flex items-center justify-center gap-3">
                  <plan.icon
                    className={`h-8 w-8 ${
                      plan.variant === "featured"
                        ? "text-[#F36509]"
                        : "text-stone-400"
                    }`}
                  />
                  <span className="font-serif text-5xl font-semibold tracking-tighter text-stone-900">
                    {plan.name}
                  </span>
                </div>

                {/* Price */}
                <div className="mb-1 text-3xl font-semibold text-stone-900">
                  {plan.price}
                </div>
                <div className="text-sm font-medium text-stone-400">
                  {plan.period}
                </div>
              </CardHeader>

              <CardContent className="space-y-8 pb-10">
                {/* Features */}
                <ul className="space-y-4 text-left">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.variant === "featured"
                            ? "bg-[#F36509]/10"
                            : "bg-stone-100"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${
                            plan.variant === "featured"
                              ? "text-[#F36509]"
                              : "text-stone-500"
                          }`}
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`h-14 w-full rounded-full text-base font-semibold transition-all ${
                    plan.variant === "featured"
                      ? "bg-[#F36509] text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30"
                      : "border-2 border-stone-900 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-white"
                  }`}
                >
                  <Link
                    href={plan.href}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
