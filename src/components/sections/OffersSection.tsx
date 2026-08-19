"use client";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap, Star } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "iWork Pass",
    subtitle: "DAILY / MONTHLY ACCESS",
    price: "₱2,500",
    period: "per month",
    description: "Flexible access for focused work sessions.",
    features: [
      "24/7 Coworking Access",
      "High-speed WiFi (up to 600 Mbps)",
      "Quiet & Collaborative Zones",
      "Perfect for freelancers & remote teams",
      "Free mineral water & charging ports",
    ],
    cta: "Get iWork Pass",
    href: "/contact",
    variant: "default" as const,
    icon: Zap,
  },
  {
    name: "iAccess Pass",
    subtitle: "LOYALTY PROGRAM",
    price: "Rewards",
    period: "across all zones",
    description: "Study • Work • Play • Eat",
    features: [
      "Priority access & VIP table perks",
      "Earn rewards points while you create",
      "Exclusive member acoustic nights",
      "10% discount on café & conference rooms",
      "Dedicated high-bandwidth VLAN",
    ],
    cta: "Join iAccess",
    href: "/passes",
    variant: "featured" as const,
    icon: Star,
    badge: "MOST POPULAR",
  },
];

export default function OffersSection() {
  return (
    <section id="passes" className="relative bg-stone-950 px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F36509]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 border border-stone-800 rounded-full text-[#F36509] text-xs font-mono font-bold tracking-widest mb-4">
            MEMBERSHIP & ACCESS
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
            Choose Your Pass
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-base leading-relaxed text-stone-400 sm:text-lg md:text-xl">
            Flexible access tailored for how you work, study, and connect.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card
                className={`relative h-full flex flex-col justify-between overflow-hidden border transition-all duration-300 hover:-translate-y-2 ${
                  plan.variant === "featured"
                    ? "border-[#F36509]/50 bg-stone-900/80 shadow-2xl shadow-orange-500/10 ring-1 ring-[#F36509]/30"
                    : "border-stone-800 bg-stone-900/40 shadow-lg hover:border-stone-700"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -right-12 top-6 w-44 rotate-45 bg-[#F36509] py-1.5 text-center text-[10px] font-mono font-bold tracking-wider text-white shadow-md sm:top-7 sm:text-xs">
                    {plan.badge}
                  </div>
                )}

                <CardHeader className="pb-4 pt-8 sm:pb-6 sm:pt-10">
                  <div className="mb-3 font-mono text-xs font-bold tracking-[3px] text-[#F36509]">
                    {plan.subtitle}
                  </div>

                  <div className="mb-3 flex items-center justify-center gap-3">
                    <plan.icon
                      className={`h-7 w-7 sm:h-8 sm:w-8 ${
                        plan.variant === "featured" ? "text-[#F36509]" : "text-stone-400"
                      }`}
                    />
                    <span className="font-serif text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
                      {plan.name}
                    </span>
                  </div>

                  <div className="mb-1 text-3xl font-bold text-white sm:text-4xl">
                    {plan.price}
                  </div>
                  <div className="text-xs font-mono text-stone-400 sm:text-sm">
                    {plan.period}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pb-8 sm:space-y-8 sm:pb-10">
                  <ul className="space-y-3.5 text-left border-t border-stone-800/80 pt-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-stone-300">
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            plan.variant === "featured"
                              ? "bg-[#F36509]/20 border border-[#F36509]/40 text-[#F36509]"
                              : "bg-stone-800 text-stone-400"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </div>
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`h-12 w-full rounded-full text-sm font-semibold transition-all sm:h-14 sm:text-base cursor-pointer ${
                      plan.variant === "featured"
                        ? "bg-[#F36509] text-white shadow-xl shadow-orange-500/25 hover:bg-[#e05a00]"
                        : "border border-stone-700 bg-stone-800/80 text-stone-200 hover:border-[#F36509] hover:text-[#F36509]"
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
                  />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
