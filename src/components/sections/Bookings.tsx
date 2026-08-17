"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Coffee,
  BookOpen,
  UtensilsCrossed,
  ArrowRight,
  Phone,
  Check,
  Info,
  User,
  MessageSquare,
  CalendarDays,
  Clock,
  Projector,
  Volume2,
  Plug,
  Utensils,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import LazyTiptapEditor from "@/components/editor/LazyTiptapEditor";
import { submitBooking } from "@/app/actions/booking";

type BookingType = "coworking" | "conference" | "bistro";
type RateKind = "hourly" | "fourHour" | "fourHourConsumable";

const bookingTypes = [
  {
    id: "coworking" as BookingType,
    label: "Coworking / Study",
    icon: BookOpen,
    description: "Focus zones and study spaces",
  },
  {
    id: "conference" as BookingType,
    label: "Conference Room",
    icon: Briefcase,
    description: "Meeting rooms for teams",
  },
  {
    id: "bistro" as BookingType,
    label: "Bistro Table",
    icon: Coffee,
    description: "Dine and work at our café",
  },
];

const conferenceRooms = [
  { value: "", label: "Any available room" },
  { value: "CONFE A", label: "CONFE A (30 pax)" },
  { value: "CONFE B", label: "CONFE B (4 pax)" },
  { value: "CONFE C", label: "iSTUDY/CONFE C (10 pax)" },
  { value: "CONFE ABC", label: "CONFE A+B+C (50 pax)" },
  { value: "ONE HUB QUIMPO", label: "One Hub Quimpo (6–12 pax)" },
];

const bistroTableTypes = [
  { value: "", label: "Any available table" },
  { value: "solo", label: "Solo Table (1 pax)" },
  { value: "duo", label: "Duo Table (2 pax)" },
  { value: "group", label: "Group Table (4-6 pax)" },
  { value: "outdoor", label: "Outdoor Seating" },
];

const guidelines = [
  "A 50% reservation fee is required to secure and lock in your booking.",
  "Our team will use the contact information you provide to call or message you within 10–30 minutes to confirm your reservation details.",
  "Once confirmed, we will send you the payment instructions via GCash or Bank Transfer.",
  "The remaining balance is due on the day of your reservation (or before, depending on agreement).",
  "Cancellations made less than 24 hours prior will forfeit the 50% reservation fee.",
  "For conference rooms, food & beverage minimums may apply depending on the package.",
];

const validTypes: BookingType[] = ["coworking", "conference", "bistro"];

const emptyForm = (type: BookingType = "coworking") => ({
  type,
  name: "",
  email: "",
  phone: "",
  date: "",
  time: "",
  endDate: "",
  endTime: "",
  pax: 1,
  room: "",
  tableType: "",
  notes: "",
  packageId: "",
  packageLabel: "",
});

// ─── Pricing data ────────────────────────────────────────────────────────────

const iStudyPackages = [
  {
    id: "istudy-hourly",
    name: "Hourly Rate",
    price: "₱50",
    unit: "/hour",
    note: "Includes 1 free cup of brewed coffee",
  },
  {
    id: "istudy-10h",
    name: "10-Hour Pass",
    price: "₱450",
    unit: "",
    note: "Consumable hours · Valid 15 days",
  },
  {
    id: "istudy-20h",
    name: "20-Hour Pass",
    price: "₱800",
    unit: "",
    note: "Consumable hours · Valid 15 days",
  },
  {
    id: "istudy-first-month",
    name: "1st Month Subscription",
    price: "₱3,000",
    unit: "",
    note: "Includes iAccess Pass",
  },
  {
    id: "istudy-monthly",
    name: "Monthly Subscription",
    price: "₱2,500",
    unit: "",
    note: "All-day pass",
  },
];

/** Grouped by physical room — used by the carousel */
const iWorkRoomsGrouped = [
  {
    id: "confe-b",
    room: "Confe B",
    image: "/images/room_b.png", // replace with your real path
    capacities: [
      {
        id: "confe-b-1-2",
        capacity: "1–2 pax",
        rates: {
          hourly: { price: "₱200", label: "Hourly" },
          fourHour: { price: "₱700", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱1,500",
            label: "4-Hour + Food Credit",
            detail: "₱500 space + ₱1,000 food credit",
          },
        },
      },
      {
        id: "confe-b-3-4",
        capacity: "3–4 pax",
        rates: {
          hourly: { price: "₱350", label: "Hourly" },
          fourHour: { price: "₱1,200", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱2,500",
            label: "4-Hour + Food Credit",
            detail: "₱750 space + ₱1,750 food credit",
          },
        },
      },
    ],
  },
  {
    id: "confe-a",
    room: "Confe A",
    image: "/images/room_a.png",
    capacities: [
      {
        id: "confe-a-5-10",
        capacity: "5–10 pax",
        rates: {
          hourly: { price: "₱500", label: "Hourly" },
          fourHour: { price: "₱1,800", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱3,800",
            label: "4-Hour + Food Credit",
            detail: "₱800 space + ₱3,000 food credit",
          },
        },
      },
      {
        id: "confe-a-11-20",
        capacity: "11–20 pax",
        rates: {
          hourly: { price: "₱650", label: "Hourly" },
          fourHour: { price: "₱2,300", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱4,700",
            label: "4-Hour + Food Credit",
            detail: "₱1,200 space + ₱3,500 food credit",
          },
        },
      },
      {
        id: "confe-a-21-30",
        capacity: "21–30 pax",
        rates: {
          hourly: { price: "₱800", label: "Hourly" },
          fourHour: { price: "₱2,800", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱5,500",
            label: "4-Hour + Food Credit",
            detail: "₱1,500 space + ₱4,000 food credit",
          },
        },
      },
    ],
  },
  {
    id: "quimpo",
    room: "One Hub Quimpo",
    image: "/images/rooms/quimpo.jpg",
    capacities: [
      {
        id: "quimpo-6-8",
        capacity: "6–8 pax",
        rates: {
          hourly: { price: "₱400", label: "Hourly" },
          fourHour: { price: "₱1,400", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱2,500",
            label: "4-Hour + Food Credit",
            detail: "₱700 space + ₱1,800 food credit",
          },
        },
      },
      {
        id: "quimpo-9-12",
        capacity: "9–12 pax",
        rates: {
          hourly: { price: "₱500", label: "Hourly" },
          fourHour: { price: "₱1,800", label: "4-Hour" },
          fourHourConsumable: {
            price: "₱3,200",
            label: "4-Hour + Food Credit",
            detail: "₱800 space + ₱2,400 food credit",
          },
        },
      },
    ],
  },
];

const generalAddOns = [
  { item: "Projector", price: "₱500", duration: "4 hours", icon: Projector },
  { item: "Speaker", price: "₱500", duration: "4 hours", icon: Volume2 },
  { item: "Extension Wire", price: "₱50", duration: "per rental", icon: Plug },
];

const bistroPackages = [
  {
    id: "ilounge",
    name: "iLounge",
    price: "Min. F&B purchase",
    unit: "",
    note: "No hourly fee · Located in Confe A · Food or beverage required",
  },
  {
    id: "hub-a-blast-day",
    name: "Hub a Blast (Day)",
    price: "₱450",
    unit: "/head",
    note: "6:00 AM – 3:00 PM · Min 50 pax · Up to 4 hours · Full catering included",
  },
  {
    id: "hub-a-blast-evening",
    name: "Hub a Blast (Evening)",
    price: "₱650",
    unit: "/head",
    note: "4:00 PM onwards · Min 50 pax · Up to 4 hours · Full catering included",
  },
];

const hubABlastDetails = {
  food: [
    "4 viands (Chicken/Fish · Pork · Beef/Seafood · Veggies/Noodles)",
    "Steamed rice",
    "1 round of drinks",
    "Fresh fruits",
  ],
  amenities: [
    "Stainless chafing dish",
    "Complete set of utensils",
    "Purified drinking water",
    "Service personnel",
    "4 hours use of iDrink & iPlay",
  ],
  addOn: { item: "Sound System", price: "₱500" },
};

function stripPackageBlock(html: string): string {
  if (!html) return "";
  return html
    .replace(/<p[^>]*data-package-block="true"[^>]*>[\s\S]*?<\/p>/gi, "")
    .replace(/^\s+|\s+$/g, "");
}

function buildPackageNotesHtml(summary: string): string {
  return `<p data-package-block="true"><strong>Selected package:</strong> ${summary}</p>`;
}

export default function BookingPage() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<BookingType>("coworking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm());

  const [selectedWorkRoomId, setSelectedWorkRoomId] = useState<string>("");
  const [selectedRateKind, setSelectedRateKind] = useState<RateKind | "">("");

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") as BookingType;
    if (typeFromUrl && validTypes.includes(typeFromUrl)) {
      setActiveTab(typeFromUrl);
      setFormData((prev) => ({ ...prev, type: typeFromUrl }));
    }
  }, [searchParams]);

  const applyPackageToNotes = (
    packageId: string,
    packageLabel: string,
    summary: string,
  ) => {
    setFormData((prev) => {
      const cleaned = stripPackageBlock(prev.notes);
      const block = buildPackageNotesHtml(summary);
      const nextNotes = cleaned ? `${block}${cleaned}` : block;
      return {
        ...prev,
        packageId,
        packageLabel,
        notes: nextNotes,
      };
    });
  };

  const clearPackageSelection = () => {
    setSelectedWorkRoomId("");
    setSelectedRateKind("");
    setFormData((prev) => ({
      ...prev,
      packageId: "",
      packageLabel: "",
      notes: stripPackageBlock(prev.notes),
    }));
  };

  const selectIStudyPackage = (pkg: (typeof iStudyPackages)[0]) => {
    if (formData.packageId === pkg.id) {
      clearPackageSelection();
      return;
    }
    const summary = `iStudy — ${pkg.name} (${pkg.price}${pkg.unit}). ${pkg.note}`;
    applyPackageToNotes(pkg.id, pkg.name, summary);
  };

  const selectWorkRate = (
    roomName: string,
    capacityId: string,
    capacityLabel: string,
    kind: RateKind,
    rates: (typeof iWorkRoomsGrouped)[0]["capacities"][0]["rates"],
  ) => {
    const rate = rates[kind];
    const id = `${capacityId}-${kind}`;
    if (formData.packageId === id) {
      clearPackageSelection();
      return;
    }
    setSelectedWorkRoomId(capacityId);
    setSelectedRateKind(kind);

    const roomValue =
      roomName === "Confe A"
        ? "CONFE A"
        : roomName === "Confe B"
          ? "CONFE B"
          : roomName === "One Hub Quimpo"
            ? "ONE HUB QUIMPO"
            : "";

    const detail = "detail" in rate && rate.detail ? ` (${rate.detail})` : "";
    const summary = `iWork — ${roomName} (${capacityLabel}) · ${rate.label}: ${rate.price}${detail}`;

    setFormData((prev) => {
      const cleaned = stripPackageBlock(prev.notes);
      const block = buildPackageNotesHtml(summary);
      const nextNotes = cleaned ? `${block}${cleaned}` : block;
      return {
        ...prev,
        packageId: id,
        packageLabel: `${roomName} · ${rate.label}`,
        room: roomValue || prev.room,
        notes: nextNotes,
      };
    });
  };

  const selectBistroPackage = (pkg: (typeof bistroPackages)[0]) => {
    if (formData.packageId === pkg.id) {
      clearPackageSelection();
      return;
    }
    let summary = `Bistro — ${pkg.name} (${pkg.price}${pkg.unit}). ${pkg.note}`;
    if (pkg.id.startsWith("hub-a-blast")) {
      summary += ` · Includes: ${[
        ...hubABlastDetails.food,
        ...hubABlastDetails.amenities,
      ].join(
        "; ",
      )}. Add-on available: ${hubABlastDetails.addOn.item} ${hubABlastDetails.addOn.price}.`;
    }
    applyPackageToNotes(pkg.id, pkg.name, summary);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "date" && !prev.endDate) {
        next.endDate = value;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.packageId) {
      toast.error("Please select a package or rate before submitting.");
      return;
    }

    const start = new Date(`${formData.date}T${formData.time}:00`);
    const end = new Date(`${formData.endDate}T${formData.endTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter valid start and end date/time.");
      return;
    }

    if (end <= start) {
      toast.error("End must be after start.");
      return;
    }

    setIsSubmitting(true);

    const result = await submitBooking({
      ...formData,
      pax: Number(formData.pax),
      type: activeTab,
    });

    if (result.success) {
      toast.success("Reservation Request Sent Successfully!", {
        description:
          "We'll contact you shortly to confirm and send payment details.",
        duration: 7000,
      });
      setFormData(emptyForm(activeTab));
      setSelectedWorkRoomId("");
      setSelectedRateKind("");
    } else {
      toast.error("Failed to Submit Reservation", {
        description:
          result.message || "Please try again or call us at 0985 571 3768",
      });
    }

    setIsSubmitting(false);
  };

  const fieldClass =
    "h-12 rounded-xl border-stone-200 bg-white px-4 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]/20";
  const labelClass =
    "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500";

  const selectedCardClass =
    "border-[#F36509] bg-[#F36509]/[0.04] shadow-sm ring-1 ring-[#F36509]/30";
  const idleCardClass =
    "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50";

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden">
        <Image
          src="/images/bistroThumbnail.png"
          alt="Reserve Your Space at iHub"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-stone-900/70" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-5 border-white/25 px-3.5 py-1 text-[11px] font-semibold tracking-widest text-white/70"
          >
            RESERVATIONS
          </Badge>

          <h1 className="mb-4 font-serif text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Reserve Your Space
          </h1>

          <p className="mx-auto max-w-lg text-lg leading-relaxed text-white/75">
            Book a table, study zone, or conference room at iHub
          </p>
        </div>
      </section>

      {/* Booking Form */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              const type = v as BookingType;
              setActiveTab(type);
              setFormData((prev) => ({
                ...emptyForm(type),
                name: prev.name,
                email: prev.email,
                phone: prev.phone,
              }));
              setSelectedWorkRoomId("");
              setSelectedRateKind("");
            }}
            className="w-full"
          >
            <div className="mb-12">
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl bg-white p-1.5 shadow-sm pb-20">
                {bookingTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 text-stone-400 transition-all data-active:bg-[#F36509] data-active:text-white data-[state=active]:shadow-md"
                  >
                    <type.icon className="h-4.5 w-4.5" />
                    <span className="text-center text-xs font-semibold leading-tight sm:text-sm">
                      {type.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <Card className="overflow-hidden border-stone-200/80 bg-white shadow-sm">
              <CardContent className="p-6 sm:p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* ─── Coworking / iStudy ─── */}
                  <TabsContent value="coworking" className="mt-0 space-y-6">
                    <TabHeader
                      icon={BookOpen}
                      title="Coworking / Study"
                      description="Quiet zones and focus areas for productive work"
                    />

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-stone-800">
                          Choose an iStudy package
                        </h4>
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                          Required
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {iStudyPackages.map((pkg) => {
                          const selected = formData.packageId === pkg.id;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => selectIStudyPackage(pkg)}
                              className={`group relative rounded-2xl border p-4 text-left transition-all duration-150 ${
                                selected ? selectedCardClass : idleCardClass
                              }`}
                            >
                              {selected && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F36509]">
                                  <Check
                                    className="h-3 w-3 text-white"
                                    strokeWidth={3}
                                  />
                                </span>
                              )}
                              <p className="pr-6 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                {pkg.name}
                              </p>
                              <p className="mt-2 font-serif text-2xl font-semibold tracking-tight text-stone-900">
                                {pkg.price}
                                {pkg.unit && (
                                  <span className="ml-0.5 text-sm font-normal text-stone-400">
                                    {pkg.unit}
                                  </span>
                                )}
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                                {pkg.note}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  </TabsContent>

                  {/* ─── Conference / iWork ─── */}
                  <TabsContent value="conference" className="mt-0 space-y-6">
                    <TabHeader
                      icon={Briefcase}
                      title="Conference Room"
                      description="Professional meeting spaces for teams and events"
                    />

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-stone-800">
                          Choose room & rate
                        </h4>
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                          Required
                        </span>
                      </div>

                      <RoomCarousel
                        rooms={iWorkRoomsGrouped}
                        selectedPackageId={formData.packageId}
                        selectedWorkRoomId={selectedWorkRoomId}
                        onSelectRate={selectWorkRate}
                        selectedCardClass={selectedCardClass}
                        idleCardClass={idleCardClass}
                      />

                      {/* Add-ons */}
                      <div className="pt-2">
                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                          Equipment add-ons
                          <span className="ml-1.5 font-normal normal-case tracking-normal text-stone-400">
                            (mention in notes if needed)
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {generalAddOns.map((a) => (
                            <div
                              key={a.item}
                              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600"
                            >
                              <a.icon className="h-3.5 w-3.5 text-[#F36509]" />
                              <span className="font-medium">{a.item}</span>
                              <span className="text-stone-400">
                                {a.price}
                                <span className="text-[10px]">
                                  {" "}
                                  / {a.duration}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </TabsContent>

                  {/* ─── Bistro ─── */}
                  <TabsContent value="bistro" className="mt-0 space-y-6">
                    <TabHeader
                      icon={Coffee}
                      title="Bistro Table"
                      description="Reserve a table at our café for dining or casual work"
                    />

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-stone-800">
                          Choose a bistro option
                        </h4>
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                          Required
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        {bistroPackages.map((pkg) => {
                          const selected = formData.packageId === pkg.id;
                          const isHub = pkg.id.startsWith("hub-a-blast");
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => selectBistroPackage(pkg)}
                              className={`group relative rounded-2xl border p-4 text-left transition-all duration-150 ${
                                selected
                                  ? selectedCardClass
                                  : isHub
                                    ? "border-[#F36509]/25 bg-gradient-to-b from-[#F36509]/[0.03] to-white hover:border-[#F36509]/40"
                                    : idleCardClass
                              }`}
                            >
                              {selected && (
                                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#F36509]">
                                  <Check
                                    className="h-3 w-3 text-white"
                                    strokeWidth={3}
                                  />
                                </span>
                              )}
                              <p className="pr-6 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                {pkg.name}
                              </p>
                              <p className="mt-2 font-serif text-xl font-semibold tracking-tight text-stone-900">
                                {pkg.price}
                                {pkg.unit && (
                                  <span className="ml-0.5 text-sm font-normal text-stone-400">
                                    {pkg.unit}
                                  </span>
                                )}
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-stone-500">
                                {pkg.note}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-[#F36509]" />
                          <p className="text-sm font-semibold text-stone-800">
                            Hub a Blast includes
                          </p>
                        </div>
                        <ul className="grid gap-1.5 sm:grid-cols-2">
                          {[
                            ...hubABlastDetails.food,
                            ...hubABlastDetails.amenities,
                          ].map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2 text-xs text-stone-600"
                            >
                              <Check
                                className="mt-0.5 h-3 w-3 shrink-0 text-[#F36509]"
                                strokeWidth={3}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs text-stone-400">
                          Optional add-on: {hubABlastDetails.addOn.item} —{" "}
                          {hubABlastDetails.addOn.price}
                        </p>
                      </div>
                    </section>
                  </TabsContent>

                  {/* Selected package chip */}
                  {formData.packageLabel && (
                    <div className="flex items-center gap-3 rounded-xl border border-[#F36509]/20 bg-[#F36509]/[0.04] px-4 py-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F36509]">
                        <Check
                          className="h-3.5 w-3.5 text-white"
                          strokeWidth={3}
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-stone-700">
                        Selected:{" "}
                        <strong className="font-semibold text-stone-900">
                          {formData.packageLabel}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={clearPackageSelection}
                        className="shrink-0 text-xs font-medium text-stone-400 transition-colors hover:text-[#F36509]"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <User className="h-3.5 w-3.5" />
                        Full Name
                      </Label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Juan Dela Cruz"
                        required
                        className={fieldClass}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <Phone className="h-3.5 w-3.5" />
                        Contact Number
                      </Label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="09XX XXX XXXX"
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>Email Address</Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className={fieldClass}
                    />
                  </div>

                  {/* Start / End */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        Start Date
                      </Label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <Clock className="h-3.5 w-3.5" />
                        Start Time
                      </Label>
                      <Input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <CalendarDays className="h-3.5 w-3.5" />
                        End Date
                      </Label>
                      <Input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.date || undefined}
                        required
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <Clock className="h-3.5 w-3.5" />
                        End Time
                      </Label>
                      <Input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  {/* Pax */}
                  <div className="max-w-[140px] space-y-1.5">
                    <Label className={labelClass}>Guests</Label>
                    <Input
                      type="number"
                      name="pax"
                      value={formData.pax}
                      onChange={handleChange}
                      min={1}
                      required
                      className={fieldClass}
                    />
                  </div>

                  {/* Conference room preference */}
                  {/* <TabsContent value="conference" className="mt-0">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <Briefcase className="h-3.5 w-3.5" />
                        Preferred Room
                      </Label>
                      <select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-900 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                      >
                        {conferenceRooms.map((room) => (
                          <option key={room.value} value={room.value}>
                            {room.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-stone-400">
                        Auto-filled when you select a rate. You can still change
                        it.
                      </p>
                    </div>
                  </TabsContent> */}

                  {/* Bistro table preference */}
                  <TabsContent value="bistro" className="mt-0">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        Preferred Table
                      </Label>
                      <select
                        name="tableType"
                        value={formData.tableType}
                        onChange={handleChange}
                        className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-900 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                      >
                        {bistroTableTypes.map((table) => (
                          <option key={table.value} value={table.value}>
                            {table.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TabsContent>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label className={labelClass}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Additional Notes
                    </Label>
                    <LazyTiptapEditor
                      value={formData.notes}
                      onChange={(html) =>
                        setFormData((prev) => ({ ...prev, notes: html }))
                      }
                      placeholder="Special requests, allergies, occasion… Package details appear here when you select one."
                      className="rounded-xl border-stone-200"
                    />
                    <p className="text-[11px] text-stone-400">
                      Selecting a package inserts a summary at the top. You can
                      edit or add more below it.
                    </p>
                  </div>

                  {/* Guidelines */}
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Info className="h-4 w-4 text-[#F36509]" />
                      <h3 className="text-sm font-semibold text-stone-900">
                        Reservation Guidelines
                      </h3>
                    </div>
                    <ul className="space-y-2.5">
                      {guidelines.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-600"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F36509]/60" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex items-center gap-2 text-xs text-stone-500">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Open 24/7. For urgent bookings call{" "}
                        <a
                          href="tel:09855713768"
                          className="font-semibold text-[#F36509] hover:underline"
                        >
                          0985 571 3768
                        </a>
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="h-12 w-full rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Reservation Request"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-center text-xs text-stone-400">
                    We will use your contact information to reach you shortly
                    and confirm your booking details.
                  </p>
                </form>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </section>

      <section className="bg-white px-6 py-12 text-center">
        <p className="font-serif text-xl italic tracking-tight text-stone-400">
          Create your future. Celebrate your now.
        </p>
      </section>
    </main>
  );
}

function TabHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
        <Icon className="h-4.5 w-4.5 text-[#F36509]" />
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold text-stone-900">
          {title}
        </h3>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
    </div>
  );
}

function RoomCarousel({
  rooms,
  selectedPackageId,
  selectedWorkRoomId,
  onSelectRate,
  selectedCardClass,
  idleCardClass,
}: {
  rooms: typeof iWorkRoomsGrouped;
  selectedPackageId: string;
  selectedWorkRoomId: string;
  onSelectRate: (
    roomName: string,
    capacityId: string,
    capacityLabel: string,
    kind: RateKind,
    rates: (typeof iWorkRoomsGrouped)[0]["capacities"][0]["rates"],
  ) => void;
  selectedCardClass: string;
  idleCardClass: string;
}) {
  const [index, setIndex] = useState(0);
  const total = rooms.length;
  const room = rooms[index];

  const goPrev = () => setIndex((i) => (i === 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === total - 1 ? 0 : i + 1));

  // Keep carousel on the room that has a selected rate
  useEffect(() => {
    if (!selectedWorkRoomId) return;
    const found = rooms.findIndex((r) =>
      r.capacities.some((c) => c.id === selectedWorkRoomId),
    );
    if (found >= 0) setIndex(found);
  }, [selectedWorkRoomId, rooms]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      {/* Image + room name overlay */}
      <div className="relative aspect-[16/9] w-full bg-stone-100 sm:aspect-[2/1]">
        <Image
          src={room.image}
          alt={room.room}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
          priority={index === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/70 via-stone-900/20 to-transparent" />

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-sm transition hover:bg-white"
          aria-label="Previous room"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-sm transition hover:bg-white"
          aria-label="Next room"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-serif text-2xl font-semibold text-white drop-shadow">
            {room.room}
          </p>
          <p className="text-sm text-white/80">
            {room.capacities.map((c) => c.capacity).join(" · ")}
          </p>
        </div>
      </div>

      {/* Rates for current room */}
      <div className="space-y-4 p-4 sm:p-5">
        {room.capacities.map((cap) => {
          const isCapActive = selectedWorkRoomId === cap.id;
          return (
            <div
              key={cap.id}
              className={`rounded-xl border p-3 transition-colors ${
                isCapActive
                  ? "border-[#F36509]/40 bg-[#F36509]/[0.03]"
                  : "border-stone-100 bg-stone-50/50"
              }`}
            >
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
                {cap.capacity}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  ["hourly", "fourHour", "fourHourConsumable"] as RateKind[]
                ).map((kind) => {
                  const rate = cap.rates[kind];
                  const id = `${cap.id}-${kind}`;
                  const selected = selectedPackageId === id;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() =>
                        onSelectRate(
                          room.room,
                          cap.id,
                          cap.capacity,
                          kind,
                          cap.rates,
                        )
                      }
                      className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                        selected ? selectedCardClass : idleCardClass
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                          {rate.label}
                        </span>
                        {selected && (
                          <Check
                            className="h-3.5 w-3.5 shrink-0 text-[#F36509]"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <p className="mt-1 font-serif text-lg font-semibold text-stone-900">
                        {rate.price}
                      </p>
                      {"detail" in rate && rate.detail && (
                        <p className="mt-0.5 text-[10px] leading-snug text-stone-400">
                          {rate.detail}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-1.5 border-t border-stone-100 py-3">
        {rooms.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to ${r.room}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-5 bg-[#F36509]"
                : "w-1.5 bg-stone-300 hover:bg-stone-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
