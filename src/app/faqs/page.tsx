"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Coffee,
  Clock,
  MapPin,
  Wifi,
  Users,
  Ticket,
  UtensilsCrossed,
  Music,
  ArrowRight,
  Phone,
  HelpCircle,
} from "lucide-react";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqSection = {
  id: string;
  title: string;
  icon: React.ElementType;
  items: FaqItem[];
};

const sections: FaqSection[] = [
  {
    id: "about",
    title: "About iHub",
    icon: HelpCircle,
    items: [
      {
        question: "What is iHub?",
        answer:
          "iHub is Davao’s 24/7 productivity and lifestyle hub. It’s the place where you can work, study, meet clients, grab coffee or a meal, unwind with friends, catch live acoustic sets, and still feel completely at home. One space that fits every part of your day.",
      },
      {
        question:
          "What makes iHub different from a regular café or coworking space?",
        answer:
          "We’re not just desks and Wi-Fi, and we’re not just coffee and meals. We’re the full experience: focused work when you need it, quiet study when you need it, good food and drinks when you want them, and a relaxed vibe for evenings and weekends. Work when you need to. Study when you need to. Unwind when you want to.",
      },
    ],
  },
  {
    id: "spaces",
    title: "Spaces & Access",
    icon: Users,
    items: [
      {
        question: "What is iLounge?",
        answer:
          "iLounge is our open collaborative space — perfect for work, study, online classes, client meetings, group discussions, or simply taking a break. It’s fully air-conditioned, charging-friendly, and comes with high-speed Wi-Fi (up to 600 Mbps, dual ISP) plus complimentary mineral water.",
      },
      {
        question: "Is there an hourly fee to use iLounge?",
        answer:
          "No hourly space rental. Just order food or drinks from the café and the space is yours. No pressure, just a comfortable environment designed to help you make the most of your day.",
      },
      {
        question: "What is iWork?",
        answer:
          "iWork is our dedicated coworking setup built for freelancers and remote workers who need reliable internet, a productive environment, and the freedom to stay as long as they need. Workspace that works.",
      },
    ],
  },
  {
    id: "passes",
    title: "Passes & Membership",
    icon: Ticket,
    items: [
      {
        question: "What is the Productivity Pass?",
        answer:
          "Coffee. WiFi. Workspace. Productivity. For ₱50/hour you get brewed coffee, high-speed Wi-Fi, charging access, printing discounts, and café discounts. Ideal for students, freelancers, and remote workers who want an affordable way to stay focused.",
      },
      {
        question: "What is the Unlimited Pass?",
        answer:
          "For people who make iHub their regular work or study base. It includes unlimited coworking, 10% off café, 10% off printing, and iAccess membership. One pass, more freedom.",
      },
      {
        question: "What is iAccess?",
        answer:
          "Loyalty should come with perks. iAccess is our annual membership (₱299/year) that rewards every visit — café discounts, coworking hours, partner discounts (including Astra), birthday treats, and more. Whether you study, work, meet friends, or just come for coffee, every visit counts.",
      },
      {
        question: "Is the iWork Pass still available?",
        answer:
          "Check with us for the latest offers. When active, the iWork Pass has been a popular option for focused, long-term workspace access.",
      },
    ],
  },
  {
    id: "amenities",
    title: "Amenities & Facilities",
    icon: Wifi,
    items: [
      {
        question: "How fast is the internet?",
        answer:
          "Up to 600 Mbps with dual ISP. Focus starts with fast internet — whether you’re on a deadline, in an online class, or jumping on a client call.",
      },
      {
        question:
          "Is the space air-conditioned and do you have charging points?",
        answer:
          "Yes. Fully air-conditioned and designed to be charging-friendly so your devices (and your productivity) stay powered.",
      },
      {
        question: "Can I work or study late at night or early in the morning?",
        answer: "Absolutely. We’re open 24/7. Your schedule, your space.",
      },
    ],
  },
  {
    id: "food",
    title: "Food & Drinks (iHub Bistro)",
    icon: UtensilsCrossed,
    items: [
      {
        question: "Do you serve food and coffee?",
        answer:
          "Yes — coffee, meals, snacks, comfort food, and drinks are available around the clock. Good work starts with a good meal, and the best conversations often start around the table.",
      },
      {
        question: "Can I just come for coffee or a meal without working?",
        answer:
          "Of course. Many people swing by purely for the café experience, a quiet break, or an evening with friends. You’re always welcome.",
      },
    ],
  },
  {
    id: "social",
    title: "Social & Evenings",
    icon: Music,
    items: [
      {
        question: "Do you have live music or evening activities?",
        answer:
          "Yes. Expect live acoustic sets, games, good drinks, and relaxed Friday nights and weekends. Chill. Acoustic. Good food. Good company. The vibe you’re looking for is here.",
      },
      {
        question: "Can I bring friends or celebrate something?",
        answer:
          "Definitely. Whether it’s a study session, a casual catch-up, or just a night that feels too good to end, iHub is built for both productivity and the moments in between.",
      },
    ],
  },
  {
    id: "location",
    title: "Location & Hours",
    icon: MapPin,
    items: [
      {
        question: "Where are you located?",
        answer:
          "We’re in Davao City. You’ll also find us at OneHub / iHub Xpress — Door 3, VC Magno Compound, Quimpo Boulevard — part of a broader business and lifestyle ecosystem (insurance, real estate, car rental, legal, document processing, and more). One stop. Multiple solutions.",
      },
      {
        question: "What are your operating hours?",
        answer: "24/7. Always.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-900 px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(243,101,9,0.18),_transparent_55%)]" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/20 px-4 py-1.5 text-xs font-bold tracking-widest text-white/70"
          >
            FAQ
          </Badge>

          <h1 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-white md:text-6xl">
            Frequently Asked Questions
          </h1>

          <p className="mx-auto mb-3 max-w-xl text-lg text-white/75">
            iHub Coworking Space &amp; Bistro
          </p>

          <p className="font-serif text-xl italic text-white/50">
            Create your future. Celebrate your now.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
              <Clock className="size-4 text-[#F36509]" />
              Open 24/7
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80">
              <Coffee className="size-4 text-[#F36509]" />
              Work · Study · Unwind
            </span>
          </div>
        </div>
      </section>

      {/* Jump links */}
      <section className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-stone-200 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-stone-600 transition-colors hover:border-[#F36509]/40 hover:bg-[#FFF4ED] hover:text-[#F36509]"
            >
              {section.title}
            </a>
          ))}
        </div>
      </section>

      {/* FAQ sections */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#F36509]/10">
                  <section.icon className="size-5 text-[#F36509]" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-stone-900">
                  {section.title}
                </h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <Accordion className="px-5 md:px-6">
                  {section.items.map((item, index) => (
                    <AccordionItem
                      key={item.question}
                      value={`${section.id}-${index}`}
                    >
                      <AccordionTrigger className="py-5 text-base font-semibold text-stone-900 hover:no-underline data-panel-open:text-[#F36509]">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[15px] leading-relaxed text-stone-600">
                        <p>{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator className="mx-auto max-w-4xl bg-stone-200" />

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-lg md:p-14">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
            <Coffee className="size-7 text-[#F36509]" />
          </div>

          <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Still have questions?
          </h2>

          <p className="mx-auto mb-8 max-w-lg text-stone-600 leading-relaxed">
            Come visit us, grab a coffee, and ask in person — or reach out and
            we’ll help you find the right pass, the right spot, or the right
            plan for your day.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 rounded-full bg-[#F36509] px-8 text-base font-semibold text-white hover:bg-[#e05a00]"
              render={<Link href="/booking" />}
            >
              Book a space
              <ArrowRight className="ml-2 size-4" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-stone-200 px-8 text-base font-semibold text-stone-700 hover:border-[#F36509]/40 hover:bg-[#FFF4ED] hover:text-[#F36509]"
              render={<a href="tel:09855713768" />}
            >
              <Phone className="mr-2 size-4" />
              0985 571 3768
            </Button>
          </div>

          <p className="mt-8 font-serif text-lg italic text-stone-400">
            See you at iHub.
          </p>
          <p className="mt-1 text-sm text-stone-400">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>

      {/* Footer tagline */}
      <section className="border-t border-stone-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-stone-500">
          iHub Coworking Space &amp; Bistro · Open 24/7 · Davao City
        </p>
      </section>
    </main>
  );
}
