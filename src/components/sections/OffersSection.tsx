import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="mb-4 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
          Choose Your Pass
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-stone-500 sm:mb-16 sm:text-lg md:text-xl">
          Flexible access tailored for how you work, study, and connect.
        </p>

        <div className="mx-auto grid max-w-3xl gap-6 sm:gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 ${
                plan.variant === "featured"
                  ? "border-[#F36509]/30 bg-white shadow-xl shadow-orange-500/5 hover:border-[#F36509]/50 hover:shadow-2xl hover:shadow-orange-500/10"
                  : "border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-lg"
              }`}
            >
              {plan.badge && (
                <div className="absolute -right-12 top-6 w-44 rotate-45 bg-[#F36509] py-1.5 text-center text-[10px] font-bold tracking-wider text-white shadow-sm sm:top-7 sm:text-xs">
                  {plan.badge}
                </div>
              )}

              <CardHeader className="pb-3 pt-8 sm:pb-4 sm:pt-10">
                <div className="mb-2 font-mono text-[10px] font-bold tracking-[3px] text-[#F36509] sm:mb-3 sm:text-xs">
                  {plan.subtitle}
                </div>

                <div className="mb-2 flex items-center justify-center gap-2 sm:gap-3">
                  <plan.icon
                    className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      plan.variant === "featured"
                        ? "text-[#F36509]"
                        : "text-stone-400"
                    }`}
                  />
                  <span className="font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl">
                    {plan.name}
                  </span>
                </div>

                <div className="mb-1 text-2xl font-semibold text-stone-900 sm:text-3xl">
                  {plan.price}
                </div>
                <div className="text-xs font-medium text-stone-400 sm:text-sm">
                  {plan.period}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
                <ul className="space-y-3 text-left sm:space-y-4">
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
                      <span className="text-sm text-stone-600 sm:text-base">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-14 sm:text-base ${
                    plan.variant === "featured"
                      ? "bg-[#F36509] text-white shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30"
                      : "border-2 border-stone-900 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-white"
                  }`}
                  render={
                    <Link
                      href={plan.href}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  }
                ></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
