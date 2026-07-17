"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Clock,
  Users,
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
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { submitBooking } from "../actions/booking";

type BookingType = "coworking" | "conference" | "bistro";

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
  "Our team will use the contact information you provide to call or message you within 2–4 hours to confirm your reservation details.",
  "Once confirmed, we will send you the payment instructions via GCash or Bank Transfer.",
  "The remaining balance is due on the day of your reservation (or before, depending on agreement).",
  "Cancellations made less than 24 hours prior will forfeit the 50% reservation fee.",
  "For conference rooms, food & beverage minimums may apply depending on the package.",
];

const validTypes: BookingType[] = ["coworking", "conference", "bistro"];

export default function BookingPage() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<BookingType>("coworking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "coworking",
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    pax: 1,
    room: "",
    tableType: "",
    notes: "",
  });

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") as BookingType;
    if (typeFromUrl && validTypes.includes(typeFromUrl)) {
      setActiveTab(typeFromUrl);
      setFormData((prev) => ({ ...prev, type: typeFromUrl }));
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Reset form
      setFormData({
        type: activeTab,
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        pax: 1,
        room: "",
        tableType: "",
        notes: "",
      });
    } else {
      toast.error("Failed to Submit Reservation", {
        description:
          result.message || "Please try again or call us at 0985 571 3768",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
        {/* Background Image */}
        <Image
          src="/images/bistroThumbnail.png"
          alt="Reserve Your Space at iHub"
          fill
          className="object-cover"
          priority
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-stone-900/70" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <Badge
            variant="outline"
            className="mb-6 border-white/30 px-4 py-1.5 text-xs font-bold tracking-widest text-white/70"
          >
            RESERVATIONS
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-white md:text-7xl">
            Reserve Your Space
          </h1>

          <p className="mx-auto max-w-xl text-xl leading-relaxed text-white/80">
            Book a table, study zone, or conference room at iHub
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* Booking Form */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as BookingType)}
            className="w-full"
          >
            {/* Tab Selection */}
            <div className="mb-10">
              <TabsList className="grid w-full grid-cols-3 gap-1.5 rounded-3xl bg-white p-1.5 min-h-[126px]">
                {bookingTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    className="cursor-pointer min-h-[96px] rounded-2xl px-4 py-6 text-sm font-semibold text-stone-400 hover:text-[#F36509] data-active:bg-[#F36509] data-active:text-white data-active:shadow-md data-active:hover:bg-white data-active:hover:text-[#F36509] data-active:hover:border-[#F36509]"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <type.icon className="h-5 w-5" />
                      <span className="text-center">{type.label}</span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Form Card */}
            <Card className="border-stone-200 bg-white shadow-lg">
              <CardContent className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* Tab Headers */}
                  <TabsContent value="coworking" className="mt-0">
                    <TabHeader
                      icon={BookOpen}
                      title="Coworking / Study Booking"
                      description="Quiet zones and focus areas for productive work"
                    />
                  </TabsContent>

                  <TabsContent value="conference" className="mt-0">
                    <TabHeader
                      icon={Briefcase}
                      title="Conference Room Booking"
                      description="Professional meeting spaces for teams and events"
                    />
                  </TabsContent>

                  <TabsContent value="bistro" className="mt-0">
                    <TabHeader
                      icon={Coffee}
                      title="Bistro Table Booking"
                      description="Reserve a table at our café for dining or casual work"
                    />
                  </TabsContent>

                  {/* Contact Info - Name & Phone (All Tabs) */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Juan Dela Cruz"
                        required
                        className="h-14 rounded-2xl border-stone-200 bg-stone-50 px-6 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                        <Phone className="h-4 w-4" />
                        Contact Number
                      </Label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="09XX XXX XXXX"
                        required
                        className="h-14 rounded-2xl border-stone-200 bg-stone-50 px-6 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]"
                      />
                    </div>
                  </div>

                  {/* Email Field - NEW */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="h-14 rounded-2xl border-stone-200 bg-stone-50 px-6 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509]"
                    />
                  </div>

                  {/* Date, Time, Pax - Add name + value + onChange to each */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pax</Label>
                      <Input
                        type="number"
                        name="pax"
                        value={formData.pax}
                        onChange={handleChange}
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  {/* Conference Room */}
                  <TabsContent value="conference" className="mt-0">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                        <Briefcase className="h-4 w-4" />
                        Preferred Room
                      </Label>
                      <select
                        name="room"
                        value={formData.room}
                        onChange={handleChange}
                        className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 px-6 text-stone-900 focus:border-[#F36509]"
                      >
                        {conferenceRooms.map((room) => (
                          <option key={room.value} value={room.value}>
                            {room.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TabsContent>

                  {/* Bistro Table */}
                  <TabsContent value="bistro" className="mt-0">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
                        <UtensilsCrossed className="h-4 w-4" />
                        Preferred Table
                      </Label>
                      <select
                        name="tableType"
                        value={formData.tableType}
                        onChange={handleChange}
                        className="h-14 w-full rounded-2xl border border-stone-200 bg-stone-50 px-6 text-stone-900 focus:border-[#F36509]"
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
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Special requests..."
                    />
                  </div>

                  {/* Guidelines */}
                  <Card className="border-stone-200 bg-stone-50">
                    <CardContent className="p-8">
                      <div className="mb-5 flex items-center gap-2">
                        <Info className="h-5 w-5 text-[#F36509]" />
                        <h3 className="font-semibold text-lg text-stone-900">
                          Reservation Guidelines
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {guidelines.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-sm leading-relaxed text-stone-600"
                          >
                            <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F36509]/10">
                              <Check
                                className="h-2.5 w-2.5 text-[#F36509]"
                                strokeWidth={3}
                              />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-center gap-2 text-xs text-stone-500">
                        <Phone className="h-3 w-3" />
                        We are open 24/7. For urgent bookings, please call us at{" "}
                        <a
                          href="tel:09855713768"
                          className="font-semibold text-[#F36509] hover:underline"
                        >
                          0985 571 3768
                        </a>
                        .
                      </div>
                    </CardContent>
                  </Card>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="cursor-pointer h-14 w-full rounded-full bg-[#F36509] text-lg font-semibold text-white shadow-xl transition-all hover:bg-[#e05a00]"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : "Submit Reservation Request"}
                    <ArrowRight className="ml-2 h-5 w-5" />
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

      {/* Bottom Tagline */}
      <section className="bg-white px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-2xl italic tracking-tight text-stone-400">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>
    </main>
  );
}

// Tab Header Component
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
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]/10">
        <Icon className="h-5 w-5 text-[#F36509]" />
      </div>
      <div>
        <h3 className="font-serif text-xl font-semibold text-stone-900">
          {title}
        </h3>
        <p className="text-sm text-stone-500">{description}</p>
      </div>
    </div>
  );
}
