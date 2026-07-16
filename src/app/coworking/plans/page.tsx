import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Users,
  Sparkles,
  Wifi,
  Coffee,
  Printer,
  Snowflake,
  Check,
  Clock,
} from "lucide-react";

const istudyPlans = [
  {
    name: "iStudy Regular Rate",
    price: "₱60",
    period: "per hour",
    note: "Cubicle Table",
    featured: false,
  },
  {
    name: "10 Hours",
    price: "₱450",
    period: "valid 15 days",
    note: "Save ₱150",
    featured: true,
  },
  {
    name: "20 Hours",
    price: "₱800",
    period: "valid 15 days",
    note: "Save ₱400",
    featured: false,
  },
];

const iworkData = [
  {
    room: "CONFE A, B, and C",
    pax: "50",
    limited15: "₱20,000",
    unlimited15: "₱22,500",
    monthlyLimited: "₱60,000",
    monthlyUnlimited: "₱70,000",
  },
  {
    room: "CONFE A",
    pax: "30",
    limited15: "₱17,500",
    unlimited15: "₱20,000",
    monthlyLimited: "₱50,000",
    monthlyUnlimited: "₱60,000",
  },
  {
    room: "CONFE B",
    pax: "4",
    limited15: "₱10,000",
    unlimited15: "₱12,500",
    monthlyLimited: "₱20,000",
    monthlyUnlimited: "₱30,000",
  },
  {
    room: "iSTUDY/CONFE C",
    pax: "10",
    limited15: "₱15,000",
    unlimited15: "₱17,500",
    monthlyLimited: "₱40,000",
    monthlyUnlimited: "₱50,000",
  },
];

const conferenceData = [
  {
    room: "CONFE A, B, and C",
    pax: "50",
    hourly: "₱1,500",
    fourHours: "₱6,500",
    excess: "₱1,700",
  },
  {
    room: "CONFE A",
    pax: "30",
    hourly: "₱800",
    fourHours: "₱5,500",
    excess: "₱1,400",
  },
  {
    room: "CONFE B",
    pax: "2",
    hourly: "₱100",
    fourHours: "₱1,000",
    excess: "₱250",
  },
  {
    room: "iSTUDY/CONFE C",
    pax: "4",
    hourly: "₱200",
    fourHours: "₱2,500",
    excess: "₱500",
  },
];

const iworkIncludes = [
  { icon: Wifi, label: "High-speed Wi-Fi (Dual ISP)" },
  { icon: Snowflake, label: "Air-conditioned rooms" },
  { icon: Coffee, label: "Complimentary coffee & water" },
  { icon: Printer, label: "Printing services (limited per month)" },
];

export default function AllPlansPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-6 py-28 text-center">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-orange-50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-50 blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <Badge
            variant="outline"
            className="mb-6 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
          >
            PRICING
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-stone-900 md:text-7xl">
            All Plans & Rates
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-500">
            Transparent pricing for iStudy, iWork, and Conference Rooms at iHub
          </p>
        </div>
      </section>

      {/* iStudy Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
              <BookOpen className="h-7 w-7 text-[#F36509]" />
            </div>
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              iStudy Plans
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Flexible hours for focused study sessions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {istudyPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  plan.featured ? "ring-2 ring-[#F36509]/20" : ""
                }`}
              >
                {plan.featured && (
                  <div className="absolute right-4 top-4">
                    <Badge className="bg-[#F36509] text-xs font-bold text-white hover:bg-[#F36509]">
                      Best Deal
                    </Badge>
                  </div>
                )}

                <CardContent className="p-8">
                  <h3 className="mb-2 font-serif text-2xl font-semibold text-stone-900">
                    {plan.name}
                  </h3>

                  <div className="mb-1 text-4xl font-bold text-[#F36509]">
                    {plan.price}
                  </div>
                  <div className="mb-4 text-sm text-stone-400">
                    {plan.period}
                  </div>

                  {plan.note && (
                    <div
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        plan.featured
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {plan.note}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* iWork Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
              <Briefcase className="h-7 w-7 text-[#F36509]" />
            </div>
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              iWork Plans
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Dedicated workspace for professionals and teams.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50 hover:bg-stone-50">
                  <TableHead className="text-left font-semibold text-stone-900">
                    Room
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Pax
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Weekly Limited
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Weekly 24/7
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Monthly Limited
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Monthly 24/7
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iworkData.map((row, i) => (
                  <TableRow
                    key={row.room}
                    className={i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}
                  >
                    <TableCell className="font-medium text-stone-900">
                      {row.room}
                    </TableCell>
                    <TableCell className="text-center text-stone-600">
                      {row.pax}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.limited15}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.unlimited15}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.monthlyLimited}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.monthlyUnlimited}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Includes */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {iworkIncludes.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm text-stone-600"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F36509]/10">
                  <item.icon className="h-4 w-4 text-[#F36509]" />
                </div>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* Conference Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
              <Users className="h-7 w-7 text-[#F36509]" />
            </div>
            <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
              Conference Room Rates
            </h2>
            <p className="mx-auto max-w-xl text-xl text-stone-500">
              Book by the hour or half-day for meetings and events.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50 hover:bg-stone-50">
                  <TableHead className="text-left font-semibold text-stone-900">
                    Room
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Pax
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Hourly
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    4 Hours (Consumable)
                  </TableHead>
                  <TableHead className="text-center font-semibold text-stone-900">
                    Excess Hour
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conferenceData.map((row, i) => (
                  <TableRow
                    key={row.room}
                    className={i % 2 === 0 ? "bg-white" : "bg-stone-50/50"}
                  >
                    <TableCell className="font-medium text-stone-900">
                      {row.room}
                    </TableCell>
                    <TableCell className="text-center text-stone-600">
                      {row.pax}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.hourly}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-[#F36509]">
                      {row.fourHours}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-stone-700">
                      {row.excess}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* CTA */}
      <section className="relative overflow-hidden bg-white px-6 py-28">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-orange-50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-50 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509]/10">
            <Sparkles className="h-7 w-7 text-[#F36509]" />
          </div>

          <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900">
            Ready to Book?
          </h2>

          <p className="mb-10 text-xl leading-relaxed text-stone-500">
            Choose your plan and reserve your space today.
          </p>

          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-12 text-lg font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00]"
          >
            <Link href="/reserve" className="inline-flex items-center gap-2">
              Reserve Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
