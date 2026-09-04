"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowRight,
  ArrowLeft,
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
  PartyPopper,
  Receipt,
  Users,
  Upload,
  FileImage,
  X,
  Wallet,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import LazyTiptapEditor from "@/components/editor/LazyTiptapEditor";
import {
  submitBooking,
  submitPaymentReceipt,
  type BillLineItem,
  type BookingPayload,
} from "@/app/actions/booking";

type BookingType = "coworking" | "conference" | "bistro" | "events";
type RateKind = "hourly" | "fourHour" | "fourHourConsumable";
type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1 as Step, label: "Personal" },
  { id: 2 as Step, label: "Booking" },
  { id: 3 as Step, label: "Payment" },
  { id: 4 as Step, label: "Receipt" },
];

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
  {
    id: "events" as BookingType,
    label: "Events",
    icon: PartyPopper,
    description: "Hub a Blast & group events",
  },
];

const bistroTableTypes = [
  { value: "", label: "Any available table" },
  { value: "solo", label: "Solo Table (1 pax)" },
  { value: "duo", label: "Duo Table (2 pax)" },
  { value: "group", label: "Group Table (4-6 pax)" },
  { value: "outdoor", label: "Outdoor Seating" },
];

/** Seating layouts available for Confe A */
const confeALayouts = [
  {
    value: "classroom",
    label: "Classroom",
    description: "Tables + chairs facing front",
    image: "/images/venue-layouts/classroom.png",
  },
  {
    value: "u-shape",
    label: "U-Shape",
    description: "Open U for discussion",
    image: "/images/venue-layouts/u-shape.png",
  },
  {
    value: "boardroom",
    label: "Boardroom",
    description: "Conference table setup",
    image: "/images/venue-layouts/conference.png",
  },
  {
    value: "banquet",
    label: "Banquet",
    description: "Round tables",
    image: "/images/venue-layouts/banquet.png",
  },
  {
    value: "theatre",
    label: "Theatre",
    description: "Rows facing front",
    image: "/images/venue-layouts/theatre.png",
  },
];

/** Venue layouts available for Events (Hub a Blast) */
const eventLayouts = [
  {
    value: "theatre",
    label: "Theatre",
    description: "Rows facing front",
    image: "/images/venue-layouts/theatre.png",
  },
  {
    value: "classroom",
    label: "Classroom",
    description: "Tables + chairs facing front",
    image: "/images/venue-layouts/classroom.png",
  },
  {
    value: "banquet",
    label: "Banquet",
    description: "Round tables",
    image: "/images/venue-layouts/banquet.png",
  },
];

const cancellationTiers = [
  {
    window: "14 days or more before",
    rule: "Cancellation is FREE. Any amount paid will be fully refunded.",
    severity: "good" as const,
  },
  {
    window: "7–13 days before",
    rule: "A ₱500 cancellation fee will be deducted. Remaining balance is refunded.",
    severity: "warn" as const,
  },
  {
    window: "1–6 days before",
    rule: "Charge equal to 50% of the total reservation amount or ₱500, whichever is higher.",
    severity: "warn" as const,
  },
  {
    window: "Same-day cancellation",
    rule: "100% non-refundable.",
    severity: "bad" as const,
  },
  {
    window: "No-show",
    rule: "Failure to arrive without prior cancellation is 100% non-refundable.",
    severity: "bad" as const,
  },
];

const reschedulingNotes = [
  "Reservations may be rescheduled once, subject to availability.",
  "Requests made at least 7 days before may be rescheduled without a fee.",
  "Requests made 1–6 days before may be subject to a ₱500 rescheduling fee.",
  "Same-day rescheduling is generally treated as a same-day cancellation (non-refundable), except in exceptional circumstances approved by iHub Management.",
  "The new reservation date must be scheduled within 30 days of the original reservation date.",
  "A second request to reschedule may be treated as a cancellation.",
];

const validTypes: BookingType[] = [
  "coworking",
  "conference",
  "bistro",
  "events",
];

const paymentMethods = [
  { value: "GCash", label: "GCash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Other", label: "Other" },
];

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
  layout: "",
  notes: "",
  packageId: "",
  packageLabel: "",
  orderNotes: "",
  dietaryRestrictions: "",
  occasion: "",
  addOnProjector: false,
  addOnSpeaker: false,
  addOnExtension: false,
  addOnSoundSystem: false,
});

const iStudyPackages = [
  {
    id: "ilounge",
    name: "iLounge",
    price: 0,
    unit: "",
    note: "No hourly fee · Min. F&B purchase required",
    billing: "min_fb" as const,
  },
  {
    id: "istudy-hourly",
    name: "Hourly Rate",
    price: 50,
    unit: "/hour",
    note: "Includes 1 free cup of brewed coffee",
    billing: "hourly" as const,
  },
  {
    id: "istudy-10h",
    name: "10-Hour Pass",
    price: 450,
    unit: "",
    note: "Consumable hours · Valid 15 days",
    billing: "fixed" as const,
  },
  {
    id: "istudy-20h",
    name: "20-Hour Pass",
    price: 800,
    unit: "",
    note: "Consumable hours · Valid 15 days",
    billing: "fixed" as const,
  },
  {
    id: "istudy-first-month",
    name: "1st Month Subscription",
    price: 3000,
    unit: "",
    note: "Includes iAccess Pass",
    billing: "fixed" as const,
  },
  {
    id: "istudy-monthly",
    name: "Monthly Subscription",
    price: 2500,
    unit: "",
    note: "All-day pass",
    billing: "fixed" as const,
  },
];

const iWorkRoomsGrouped = [
  {
    id: "confe-b",
    room: "Confe B",
    image: "/images/room_b.png",
    capacities: [
      {
        id: "confe-b-1-2",
        capacity: "1–2 pax",
        rates: {
          hourly: { price: 200, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 700, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 1500,
            label: "4-Hour + Food Credit",
            detail: "₱500 space + ₱1,000 food credit",
            billing: "fixed" as const,
          },
        },
      },
      {
        id: "confe-b-3-4",
        capacity: "3–4 pax",
        rates: {
          hourly: { price: 350, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 1200, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 2500,
            label: "4-Hour + Food Credit",
            detail: "₱750 space + ₱1,750 food credit",
            billing: "fixed" as const,
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
          hourly: { price: 500, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 1800, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 3800,
            label: "4-Hour + Food Credit",
            detail: "₱800 space + ₱3,000 food credit",
            billing: "fixed" as const,
          },
        },
      },
      {
        id: "confe-a-11-20",
        capacity: "11–20 pax",
        rates: {
          hourly: { price: 650, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 2300, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 4700,
            label: "4-Hour + Food Credit",
            detail: "₱1,200 space + ₱3,500 food credit",
            billing: "fixed" as const,
          },
        },
      },
      {
        id: "confe-a-21-30",
        capacity: "21–30 pax",
        rates: {
          hourly: { price: 800, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 2800, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 5500,
            label: "4-Hour + Food Credit",
            detail: "₱1,500 space + ₱4,000 food credit",
            billing: "fixed" as const,
          },
        },
      },
    ],
  },
  {
    id: "quimpo",
    room: "One Hub Quimpo",
    image: "/images/room_quimps.png",
    capacities: [
      {
        id: "quimpo-6-8",
        capacity: "6–8 pax",
        rates: {
          hourly: { price: 400, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 1400, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 2500,
            label: "4-Hour + Food Credit",
            detail: "₱700 space + ₱1,800 food credit",
            billing: "fixed" as const,
          },
        },
      },
      {
        id: "quimpo-9-12",
        capacity: "9–12 pax",
        rates: {
          hourly: { price: 500, label: "Hourly", billing: "hourly" as const },
          fourHour: { price: 1800, label: "4-Hour", billing: "fixed" as const },
          fourHourConsumable: {
            price: 3200,
            label: "4-Hour + Food Credit",
            detail: "₱800 space + ₱2,400 food credit",
            billing: "fixed" as const,
          },
        },
      },
    ],
  },
];

const generalAddOns = [
  {
    id: "projector" as const,
    item: "Projector",
    price: 500,
    duration: "4 hours",
    icon: Projector,
  },
  {
    id: "speaker" as const,
    item: "Speaker",
    price: 500,
    duration: "4 hours",
    icon: Volume2,
  },
  {
    id: "extension" as const,
    item: "Extension Wire",
    price: 50,
    duration: "per rental",
    icon: Plug,
  },
];

const bistroPackages = [
  {
    id: "ilounge",
    name: "iLounge",
    price: 0,
    unit: "",
    note: "No hourly fee · Located in Confe A · Min. F&B purchase required",
    billing: "min_fb" as const,
  },
  {
    id: "regular-table",
    name: "Regular Table",
    price: 0,
    unit: "",
    note: "Standard bistro seating · No hourly fee · Order from the menu",
    billing: "min_fb" as const,
  },
];

const eventPackages = [
  {
    id: "hub-a-blast-day",
    name: "Hub a Blast (Day)",
    price: 450,
    unit: "/head",
    note: "6:00 AM – 3:00 PM · Min 50 pax · Up to 4 hours · Full catering included",
    billing: "per_head" as const,
    minPax: 50,
  },
  {
    id: "hub-a-blast-evening",
    name: "Hub a Blast (Evening)",
    price: 650,
    unit: "/head",
    note: "4:00 PM onwards · Min 50 pax · Up to 4 hours · Full catering included",
    billing: "per_head" as const,
    minPax: 50,
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
  addOn: { item: "Sound System", price: 500 },
};

function formatPHP(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`;
}

function stripPackageBlock(html: string): string {
  if (!html) return "";
  return html
    .replace(/<p[^>]*data-package-block="true"[^>]*>[\s\S]*?<\/p>/gi, "")
    .replace(/^\s+|\s+$/g, "");
}

function buildPackageNotesHtml(summary: string): string {
  return `<p data-package-block="true"><strong>Selected package:</strong> ${summary}</p>`;
}

function computeHours(
  date: string,
  time: string,
  endDate: string,
  endTime: string,
): number | null {
  if (!date || !time || !endDate || !endTime) return null;
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(`${endDate}T${endTime}:00`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  )
    return null;
  const ms = end.getTime() - start.getTime();
  const hours = ms / (1000 * 60 * 60);
  return Math.ceil(hours * 2) / 2;
}

export default function BookingPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>(1);
  const [activeTab, setActiveTab] = useState<BookingType>("coworking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  const [selectedWorkRoomId, setSelectedWorkRoomId] = useState<string>("");
  const [selectedRateKind, setSelectedRateKind] = useState<RateKind | "">("");
  const [workRateMeta, setWorkRateMeta] = useState<{
    price: number;
    label: string;
    billing: "hourly" | "fixed";
    roomName: string;
    capacityLabel: string;
  } | null>(null);

  // Receipt step state
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptMethod, setReceiptMethod] = useState("GCash");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const typeFromUrl = searchParams.get("type") as BookingType;
    if (typeFromUrl && validTypes.includes(typeFromUrl)) {
      setActiveTab(typeFromUrl);
      setFormData((prev) => ({ ...prev, type: typeFromUrl }));
    }
  }, [searchParams]);

  const hours = useMemo(
    () =>
      computeHours(
        formData.date,
        formData.time,
        formData.endDate,
        formData.endTime,
      ),
    [formData.date, formData.time, formData.endDate, formData.endTime],
  );

  const bill = useMemo(() => {
    const lines: BillLineItem[] = [];
    let total = 0;

    if (!formData.packageId) {
      return { lines, total, deposit: 0, hours: hours ?? undefined };
    }

    if (activeTab === "coworking") {
      const pkg = iStudyPackages.find((p) => p.id === formData.packageId);
      if (pkg) {
        if (pkg.billing === "hourly") {
          const h = hours ?? 1;
          const amount = pkg.price * h;
          lines.push({
            label: `iStudy — ${pkg.name}`,
            detail: `${formatPHP(pkg.price)}/hr × ${h} hr${h !== 1 ? "s" : ""}`,
            amount,
          });
          total += amount;
        } else {
          lines.push({
            label: `iStudy — ${pkg.name}`,
            detail: pkg.note,
            amount: pkg.price,
          });
          total += pkg.price;
        }
      }
    }

    if (activeTab === "conference" && workRateMeta) {
      if (workRateMeta.billing === "hourly") {
        const h = hours ?? 1;
        const amount = workRateMeta.price * h;
        lines.push({
          label: `iWork — ${workRateMeta.roomName} (${workRateMeta.capacityLabel})`,
          detail: `${workRateMeta.label}: ${formatPHP(workRateMeta.price)}/hr × ${h} hr${h !== 1 ? "s" : ""}`,
          amount,
        });
        total += amount;
      } else {
        lines.push({
          label: `iWork — ${workRateMeta.roomName} (${workRateMeta.capacityLabel})`,
          detail: `${workRateMeta.label}: ${formatPHP(workRateMeta.price)}`,
          amount: workRateMeta.price,
        });
        total += workRateMeta.price;
      }

      if (formData.addOnProjector) {
        lines.push({ label: "Projector", detail: "4 hours", amount: 500 });
        total += 500;
      }
      if (formData.addOnSpeaker) {
        lines.push({ label: "Speaker", detail: "4 hours", amount: 500 });
        total += 500;
      }
      if (formData.addOnExtension) {
        lines.push({
          label: "Extension Wire",
          detail: "per rental",
          amount: 50,
        });
        total += 50;
      }
    }

    if (activeTab === "bistro") {
      const pkg = bistroPackages.find((p) => p.id === formData.packageId);
      if (pkg) {
        lines.push({
          label: `Bistro — ${pkg.name}`,
          detail: pkg.note,
          amount: 0,
        });
      }
    }

    if (activeTab === "events") {
      const pkg = eventPackages.find((p) => p.id === formData.packageId);
      if (pkg) {
        const pax = Math.max(formData.pax || 1, pkg.minPax || 1);
        const amount = pkg.price * pax;
        lines.push({
          label: `Events — ${pkg.name}`,
          detail: `${formatPHP(pkg.price)}/head × ${pax} pax`,
          amount,
        });
        total += amount;

        if (formData.addOnSoundSystem) {
          lines.push({
            label: hubABlastDetails.addOn.item,
            detail: "Event add-on",
            amount: hubABlastDetails.addOn.price,
          });
          total += hubABlastDetails.addOn.price;
        }
      }
    }

    const deposit = Math.ceil(total * 0.5);
    return { lines, total, deposit, hours: hours ?? undefined };
  }, [formData, activeTab, workRateMeta, hours]);

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
    setWorkRateMeta(null);
    setFormData((prev) => ({
      ...prev,
      packageId: "",
      packageLabel: "",
      layout: "",
      notes: stripPackageBlock(prev.notes),
      addOnProjector: false,
      addOnSpeaker: false,
      addOnExtension: false,
      addOnSoundSystem: false,
    }));
  };

  const selectIStudyPackage = (pkg: (typeof iStudyPackages)[0]) => {
    if (formData.packageId === pkg.id) {
      clearPackageSelection();
      return;
    }
    const summary = `iStudy — ${pkg.name} (${formatPHP(pkg.price)}${pkg.unit}). ${pkg.note}`;
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
    setWorkRateMeta({
      price: rate.price,
      label: rate.label,
      billing: rate.billing,
      roomName,
      capacityLabel,
    });

    const roomValue =
      roomName === "Confe A"
        ? "CONFE A"
        : roomName === "Confe B"
          ? "CONFE B"
          : roomName === "One Hub Quimpo"
            ? "ONE HUB QUIMPO"
            : "";

    const detail = "detail" in rate && rate.detail ? ` (${rate.detail})` : "";
    const summary = `iWork — ${roomName} (${capacityLabel}) · ${rate.label}: ${formatPHP(rate.price)}${detail}`;

    setFormData((prev) => {
      const cleaned = stripPackageBlock(prev.notes);
      const block = buildPackageNotesHtml(summary);
      const nextNotes = cleaned ? `${block}${cleaned}` : block;
      return {
        ...prev,
        packageId: id,
        packageLabel: `${roomName} · ${rate.label}`,
        room: roomValue || prev.room,
        // Layout only applies to Confe A — reset when switching rooms
        layout: roomName === "Confe A" ? prev.layout : "",
        notes: nextNotes,
      };
    });
  };

  const isConfeASelected =
    workRateMeta?.roomName === "Confe A" || formData.room === "CONFE A";

  const selectBistroPackage = (pkg: (typeof bistroPackages)[0]) => {
    if (formData.packageId === pkg.id) {
      clearPackageSelection();
      return;
    }
    const summary = `Bistro — ${pkg.name}. ${pkg.note}`;
    applyPackageToNotes(pkg.id, pkg.name, summary);
  };

  const selectEventPackage = (pkg: (typeof eventPackages)[0]) => {
    if (formData.packageId === pkg.id) {
      clearPackageSelection();
      return;
    }
    let summary = `Events — ${pkg.name} (${formatPHP(pkg.price)}${pkg.unit}). ${pkg.note}`;
    summary += ` · Includes: ${[...hubABlastDetails.food, ...hubABlastDetails.amenities].join("; ")}.`;
    applyPackageToNotes(pkg.id, pkg.name, summary);
    setFormData((prev) => ({
      ...prev,
      pax: Math.max(prev.pax, pkg.minPax),
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "date" && !prev.endDate) {
        next.endDate = value;
      }
      if (name === "pax") {
        next.pax = Math.max(1, Number(value) || 1);
      }
      return next;
    });
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your contact number.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.packageId) {
      toast.error("Please select a package or rate.");
      return false;
    }
    const start = new Date(`${formData.date}T${formData.time}:00`);
    const end = new Date(`${formData.endDate}T${formData.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter valid start and end date/time.");
      return false;
    }
    if (end <= start) {
      toast.error("End must be after start.");
      return false;
    }
    if (activeTab === "events") {
      const pkg = eventPackages.find((p) => p.id === formData.packageId);
      if (pkg && formData.pax < pkg.minPax) {
        toast.error(`Hub a Blast requires a minimum of ${pkg.minPax} guests.`);
        return false;
      }
    }
    const isHourly =
      formData.packageId === "istudy-hourly" ||
      (workRateMeta && workRateMeta.billing === "hourly");
    if (isHourly && (hours === null || hours <= 0)) {
      toast.error("Please set a valid start and end time for hourly rates.");
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }
    if (step === 3) {
      setStep(4);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3 && !bookingSubmitted) setStep(2);
    else if (step === 4) setStep(3);
  };

  const handleSubmitBooking = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);

    const layoutLabel =
      confeALayouts.find((l) => l.value === formData.layout)?.label ||
      eventLayouts.find((l) => l.value === formData.layout)?.label;
    const layoutContext =
      activeTab === "events"
        ? "Events"
        : activeTab === "conference"
          ? "Confe A"
          : "venue";
    const layoutNote =
      formData.layout && layoutLabel
        ? `<p><strong>Preferred layout (${layoutContext}):</strong> ${layoutLabel}</p>`
        : "";

    const payload: BookingPayload = {
      ...formData,
      pax: Number(formData.pax),
      type: activeTab,
      notes: layoutNote
        ? `${layoutNote}${formData.notes || ""}`
        : formData.notes,
      billLines: bill.lines,
      billTotal: bill.total,
      billDeposit: bill.deposit,
      billHours: bill.hours,
    };

    const result = await submitBooking(payload);

    if (result.success) {
      toast.success("Reservation request sent!", {
        description:
          "Pay the 50% fee below, then continue to upload your receipt.",
        duration: 6000,
      });
      setBookingSubmitted(true);
      if (bill.deposit > 0) {
        setReceiptAmount(String(bill.deposit));
      }
    } else {
      toast.error("Failed to submit reservation", {
        description:
          result.message || "Please try again or call us at 0985 571 3768",
      });
    }

    setIsSubmitting(false);
  };

  const clearReceiptFile = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(null);
    setReceiptPreview(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const onReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    if (!next) {
      setReceiptFile(null);
      setReceiptPreview(null);
      return;
    }
    if (next.size > 8 * 1024 * 1024) {
      toast.error("File is too large. Max size is 8 MB.");
      e.target.value = "";
      return;
    }
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    if (next.type && !allowed.includes(next.type)) {
      toast.error("Please upload a JPG, PNG, WEBP, HEIC, or PDF.");
      e.target.value = "";
      return;
    }
    setReceiptFile(next);
    if (next.type.startsWith("image/")) {
      setReceiptPreview(URL.createObjectURL(next));
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!receiptFile) {
      toast.error("Please attach your payment receipt.");
      return;
    }
    if (!receiptAmount.trim()) {
      toast.error("Please enter the amount you paid.");
      return;
    }

    setIsSubmittingReceipt(true);

    const fd = new FormData();
    fd.set("name", formData.name.trim());
    fd.set("email", formData.email.trim());
    fd.set("phone", formData.phone.trim());
    fd.set("amountPaid", receiptAmount.trim());
    fd.set("paymentMethod", receiptMethod);
    fd.set("notes", receiptNotes.trim());
    fd.set("receipt", receiptFile);

    const result = await submitPaymentReceipt(fd);

    if (result.success) {
      toast.success("Receipt submitted successfully!", {
        description:
          "We've notified the iHub team. We'll verify and confirm your booking shortly.",
        duration: 7000,
      });
      clearReceiptFile();
      setReceiptNotes("");
      // Soft reset to start of flow after success
      setTimeout(() => {
        setStep(1);
        setBookingSubmitted(false);
        setFormData(emptyForm(activeTab));
        setSelectedWorkRoomId("");
        setSelectedRateKind("");
        setWorkRateMeta(null);
        setReceiptAmount("");
        setReceiptMethod("GCash");
      }, 1500);
    } else {
      toast.error("Failed to submit receipt", {
        description:
          result.message || "Please try again or call us at 0985 571 3768",
      });
    }

    setIsSubmittingReceipt(false);
  };

  const fieldClass =
    "h-12 rounded-xl border-stone-200 bg-white px-4 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]/20";
  const labelClass =
    "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500";
  const selectedCardClass =
    "border-[#F36509] bg-[#F36509]/[0.04] shadow-sm ring-1 ring-[#F36509]/30";
  const idleCardClass =
    "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50";

  const isHubABlast = formData.packageId?.startsWith("hub-a-blast");

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden sm:min-h-[520px]">
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
            Book a table, study zone, conference room, or event at iHub
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {/* Step indicator */}
          <div className="mb-8">
            <ol className="flex items-center justify-between gap-1">
              {STEPS.map((s, i) => {
                const active = step === s.id;
                const done = step > s.id;
                return (
                  <li key={s.id} className="flex flex-1 items-center gap-1">
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                          done
                            ? "bg-[#F36509] text-white"
                            : active
                              ? "bg-[#F36509] text-white ring-4 ring-[#F36509]/20"
                              : "bg-white text-stone-400 ring-1 ring-stone-200"
                        }`}
                      >
                        {done ? (
                          <Check className="h-4 w-4" strokeWidth={3} />
                        ) : (
                          s.id
                        )}
                      </span>
                      <span
                        className={`hidden text-[11px] font-semibold sm:block ${
                          active || done ? "text-stone-800" : "text-stone-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 rounded-full ${
                          step > s.id ? "bg-[#F36509]" : "bg-stone-200"
                        }`}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          <Card className="overflow-hidden border-stone-200/80 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8 md:p-10">
              {/* ─── STEP 1: Personal ─── */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
                      <User className="h-4.5 w-4.5 text-[#F36509]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-stone-900">
                        Your details
                      </h3>
                      <p className="text-sm text-stone-500">
                        We&apos;ll use this to confirm your booking and send
                        payment instructions.
                      </p>
                    </div>
                  </div>

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

                  <Button
                    type="button"
                    size="lg"
                    onClick={goNext}
                    className="h-12 w-full rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                  >
                    Continue to booking
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* ─── STEP 2: Booking ─── */}
              {step === 2 && (
                <div className="space-y-8">
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
                      setWorkRateMeta(null);
                    }}
                    className="w-full"
                  >
                    <div className="mb-8">
                      <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-stone-100 p-1.5 sm:grid-cols-4 pb-20">
                        {bookingTypes.map((type) => (
                          <TabsTrigger
                            key={type.id}
                            value={type.id}
                            className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3.5 text-stone-400 transition-all data-active:bg-[#F36509] data-active:text-white data-[state=active]:shadow-md sm:px-3 sm:py-4"
                          >
                            <type.icon className="h-4.5 w-4.5" />
                            <span className="text-center text-[11px] font-semibold leading-tight sm:text-xs">
                              {type.label}
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>

                    {/* Coworking */}
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
                                  {pkg.price === 0 ? (
                                    "Min. F&B purchase"
                                  ) : (
                                    <>
                                      {formatPHP(pkg.price)}
                                      {pkg.unit && (
                                        <span className="ml-0.5 text-sm font-normal text-stone-400">
                                          {pkg.unit}
                                        </span>
                                      )}
                                    </>
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

                    {/* Conference */}
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

                        {/* Confe A seating layout */}
                        {isConfeASelected && formData.packageId && (
                          <div className="space-y-3 pt-1">
                            <div className="flex items-center justify-between">
                              <Label className={labelClass}>
                                <Users className="h-3.5 w-3.5" />
                                Preferred layout (Confe A)
                              </Label>
                              {formData.layout && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      layout: "",
                                    }))
                                  }
                                  className="text-[11px] font-medium text-stone-400 hover:text-[#F36509]"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              {confeALayouts.map((opt) => {
                                const selected = formData.layout === opt.value;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        layout:
                                          prev.layout === opt.value
                                            ? ""
                                            : opt.value,
                                      }))
                                    }
                                    className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-150 ${
                                      selected
                                        ? selectedCardClass
                                        : idleCardClass
                                    }`}
                                  >
                                    <div className="relative aspect-[4/3] w-full bg-stone-100">
                                      <Image
                                        src={opt.image}
                                        alt={opt.label}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, 220px"
                                      />
                                      {selected && (
                                        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#F36509] shadow-md">
                                          <Check
                                            className="h-3.5 w-3.5 text-white"
                                            strokeWidth={3}
                                          />
                                        </span>
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <p className="text-sm font-semibold text-stone-900">
                                        {opt.label}
                                      </p>
                                      <p className="mt-0.5 text-xs text-stone-500">
                                        {opt.description}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[11px] text-stone-400">
                              Subject to availability and room capacity. Our
                              team will confirm the final setup.
                            </p>
                          </div>
                        )}

                        <div className="pt-2">
                          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                            Equipment add-ons
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {generalAddOns.map((a) => {
                              const checked =
                                a.id === "projector"
                                  ? formData.addOnProjector
                                  : a.id === "speaker"
                                    ? formData.addOnSpeaker
                                    : formData.addOnExtension;
                              const name =
                                a.id === "projector"
                                  ? "addOnProjector"
                                  : a.id === "speaker"
                                    ? "addOnSpeaker"
                                    : "addOnExtension";
                              return (
                                <label
                                  key={a.item}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all ${
                                    checked
                                      ? "border-[#F36509] bg-[#F36509]/10 text-stone-800"
                                      : "border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    name={name}
                                    checked={checked}
                                    onChange={handleChange}
                                    className="sr-only"
                                  />
                                  <a.icon className="h-3.5 w-3.5 text-[#F36509]" />
                                  <span className="font-medium">{a.item}</span>
                                  <span className="text-stone-400">
                                    {formatPHP(a.price)}
                                    <span className="text-[10px]">
                                      {" "}
                                      / {a.duration}
                                    </span>
                                  </span>
                                  {checked && (
                                    <Check
                                      className="h-3 w-3 text-[#F36509]"
                                      strokeWidth={3}
                                    />
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </section>
                    </TabsContent>

                    {/* Bistro */}
                    <TabsContent value="bistro" className="mt-0 space-y-6">
                      <TabHeader
                        icon={Coffee}
                        title="Bistro Table"
                        description="Reserve a table at our café for dining or casual work"
                      />
                      <section className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className={labelClass}>
                            <Users className="h-3.5 w-3.5" />
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
                      </section>
                    </TabsContent>

                    {/* Events */}
                    <TabsContent value="events" className="mt-0 space-y-6">
                      <TabHeader
                        icon={PartyPopper}
                        title="Events"
                        description="Hub a Blast packages for celebrations and group gatherings"
                      />
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-stone-800">
                            Choose an event package
                          </h4>
                          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                            Required
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {eventPackages.map((pkg) => {
                            const selected = formData.packageId === pkg.id;
                            return (
                              <button
                                key={pkg.id}
                                type="button"
                                onClick={() => selectEventPackage(pkg)}
                                className={`group relative rounded-2xl border p-4 text-left transition-all duration-150 ${
                                  selected
                                    ? selectedCardClass
                                    : "border-[#F36509]/25 bg-gradient-to-b from-[#F36509]/[0.03] to-white hover:border-[#F36509]/40"
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
                                  {formatPHP(pkg.price)}
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

                        {isHubABlast && (
                          <>
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
                            </div>

                            {/* Events venue layout */}
                            <div className="space-y-3 pt-1">
                              <div className="flex items-center justify-between">
                                <Label className={labelClass}>
                                  <Users className="h-3.5 w-3.5" />
                                  Preferred venue layout
                                </Label>
                                {formData.layout && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        layout: "",
                                      }))
                                    }
                                    className="text-[11px] font-medium text-stone-400 hover:text-[#F36509]"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <div className="grid gap-3 sm:grid-cols-3">
                                {eventLayouts.map((opt) => {
                                  const selected =
                                    formData.layout === opt.value;
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          layout:
                                            prev.layout === opt.value
                                              ? ""
                                              : opt.value,
                                        }))
                                      }
                                      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-150 ${
                                        selected
                                          ? selectedCardClass
                                          : idleCardClass
                                      }`}
                                    >
                                      <div className="relative aspect-[4/3] w-full bg-stone-100">
                                        <Image
                                          src={opt.image}
                                          alt={opt.label}
                                          fill
                                          className="object-cover"
                                          sizes="(max-width: 640px) 100vw, 220px"
                                        />
                                        {selected && (
                                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#F36509] shadow-md">
                                            <Check
                                              className="h-3.5 w-3.5 text-white"
                                              strokeWidth={3}
                                            />
                                          </span>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <p className="text-sm font-semibold text-stone-900">
                                          {opt.label}
                                        </p>
                                        <p className="mt-0.5 text-xs text-stone-500">
                                          {opt.description}
                                        </p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[11px] text-stone-400">
                                Subject to availability and guest count. Our
                                team will confirm the final setup.
                              </p>
                            </div>

                            <div className="space-y-4 rounded-2xl border border-[#F36509]/20 bg-[#F36509]/[0.03] p-4">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-[#F36509]" />
                                <p className="text-sm font-semibold text-stone-800">
                                  Event &amp; order details
                                </p>
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelClass}>Occasion</Label>
                                <Input
                                  type="text"
                                  name="occasion"
                                  value={formData.occasion}
                                  onChange={handleChange}
                                  placeholder="Birthday, company outing, reunion…"
                                  className={fieldClass}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelClass}>
                                  Dietary restrictions / allergies
                                </Label>
                                <Input
                                  type="text"
                                  name="dietaryRestrictions"
                                  value={formData.dietaryRestrictions}
                                  onChange={handleChange}
                                  placeholder="e.g. no pork, vegetarian options, nut allergy"
                                  className={fieldClass}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelClass}>
                                  Special requests / order notes
                                </Label>
                                <textarea
                                  name="orderNotes"
                                  value={formData.orderNotes}
                                  onChange={handleChange}
                                  rows={3}
                                  placeholder="Preferred viands, drink preferences, setup notes…"
                                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                                />
                              </div>
                              <label
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs transition-all ${
                                  formData.addOnSoundSystem
                                    ? "border-[#F36509] bg-[#F36509]/10 text-stone-800"
                                    : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  name="addOnSoundSystem"
                                  checked={formData.addOnSoundSystem}
                                  onChange={handleChange}
                                  className="sr-only"
                                />
                                <Volume2 className="h-3.5 w-3.5 text-[#F36509]" />
                                <span className="font-medium">
                                  {hubABlastDetails.addOn.item} —{" "}
                                  {formatPHP(hubABlastDetails.addOn.price)}
                                </span>
                                {formData.addOnSoundSystem && (
                                  <Check
                                    className="h-3 w-3 text-[#F36509]"
                                    strokeWidth={3}
                                  />
                                )}
                              </label>
                            </div>
                          </>
                        )}
                      </section>
                    </TabsContent>
                  </Tabs>

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

                  {/* Dates */}
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

                  {hours !== null && hours > 0 && (
                    <p className="text-xs text-stone-500">
                      Duration:{" "}
                      <strong className="text-stone-700">
                        {hours} hour{hours !== 1 ? "s" : ""}
                      </strong>
                      {(formData.packageId === "istudy-hourly" ||
                        workRateMeta?.billing === "hourly") &&
                        " · used for hourly rate calculation"}
                    </p>
                  )}

                  <div className="max-w-[160px] space-y-1.5">
                    <Label className={labelClass}>Guests</Label>
                    <Input
                      type="number"
                      name="pax"
                      value={formData.pax}
                      onChange={handleChange}
                      min={isHubABlast ? 50 : 1}
                      required
                      className={fieldClass}
                    />
                    {isHubABlast && (
                      <p className="text-[11px] text-stone-400">
                        Min. 50 for Hub a Blast
                      </p>
                    )}
                  </div>

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
                      placeholder="Special requests, allergies, occasion…"
                      className="rounded-xl border-stone-200"
                    />
                  </div>

                  {bill.lines.length > 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 sm:p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-[#F36509]" />
                        <h3 className="text-sm font-semibold text-stone-900">
                          Estimated bill
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {bill.lines.map((line, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-stone-800">
                                {line.label}
                              </p>
                              {line.detail && (
                                <p className="text-xs text-stone-500">
                                  {line.detail}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 font-semibold text-stone-900">
                              {line.amount > 0 ? formatPHP(line.amount) : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-stone-600">
                            Total
                          </span>
                          <span className="font-serif text-lg font-semibold text-stone-900">
                            {formatPHP(bill.total)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-[#F36509]">
                            50% reservation fee due now
                          </span>
                          <span className="font-serif text-lg font-semibold text-[#F36509]">
                            {formatPHP(bill.deposit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={goBack}
                      className="h-12 rounded-full border-stone-200 sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      onClick={goNext}
                      className="h-12 flex-1 rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                    >
                      Continue to payment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── STEP 3: Payment ─── */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
                      <Wallet className="h-4.5 w-4.5 text-[#F36509]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-stone-900">
                        {bookingSubmitted
                          ? "Pay your reservation fee"
                          : "Review & submit"}
                      </h3>
                      <p className="text-sm text-stone-500">
                        {bookingSubmitted
                          ? "Send the 50% fee via GCash, then upload your receipt in the next step."
                          : "Confirm your details, submit the request, then pay the 50% fee."}
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Booking summary
                    </p>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-stone-500">Guest</dt>
                        <dd className="font-semibold text-stone-900">
                          {formData.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Contact</dt>
                        <dd className="font-semibold text-stone-900">
                          {formData.email} · {formData.phone}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Package</dt>
                        <dd className="font-semibold text-stone-900">
                          {formData.packageLabel || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">When</dt>
                        <dd className="font-semibold text-stone-900">
                          {formData.date}
                          {formData.endDate &&
                          formData.endDate !== formData.date
                            ? ` → ${formData.endDate}`
                            : ""}{" "}
                          · {formData.time}
                          {formData.endTime ? ` – ${formData.endTime}` : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-stone-500">Guests</dt>
                        <dd className="font-semibold text-stone-900">
                          {formData.pax} pax
                        </dd>
                      </div>
                      {formData.layout && (
                        <div>
                          <dt className="text-stone-500">
                            {activeTab === "events"
                              ? "Venue layout"
                              : "Layout (Confe A)"}
                          </dt>
                          <dd className="font-semibold text-stone-900">
                            {confeALayouts.find(
                              (l) => l.value === formData.layout,
                            )?.label ||
                              eventLayouts.find(
                                (l) => l.value === formData.layout,
                              )?.label ||
                              formData.layout}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {bill.lines.length > 0 && (
                    <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5 sm:p-6">
                      <div className="mb-4 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-[#F36509]" />
                        <h3 className="text-sm font-semibold text-stone-900">
                          Bill breakdown
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {bill.lines.map((line, i) => (
                          <li
                            key={i}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-stone-800">
                                {line.label}
                              </p>
                              {line.detail && (
                                <p className="text-xs text-stone-500">
                                  {line.detail}
                                </p>
                              )}
                            </div>
                            <span className="shrink-0 font-semibold text-stone-900">
                              {line.amount > 0 ? formatPHP(line.amount) : "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 space-y-2 border-t border-stone-200 pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-stone-600">
                            Total
                          </span>
                          <span className="font-serif text-lg font-semibold text-stone-900">
                            {formatPHP(bill.total)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-[#F36509]">
                            50% reservation fee due now
                          </span>
                          <span className="font-serif text-lg font-semibold text-[#F36509]">
                            {formatPHP(bill.deposit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment instructions + QR — always visible on step 3 */}
                  <div className="rounded-2xl border border-[#F36509] bg-[#FFF4ED] p-5 sm:p-6">
                    <h3 className="mb-4 text-sm font-semibold text-stone-900">
                      Payment instructions
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-stone-700">
                      Please send the{" "}
                      <strong>
                        50% reservation fee
                        {bill.deposit > 0
                          ? ` of ${formatPHP(bill.deposit)}`
                          : ""}
                      </strong>{" "}
                      via GCash. Include your full name in the reference/notes.
                    </p>
                    <div className="mb-4 rounded-xl bg-white p-4">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#F36509]">
                        GCash
                      </p>
                      <p className="text-xl font-bold text-stone-900">
                        0912 967 6049
                      </p>
                      <p className="text-sm text-stone-500">
                        Account Name: Mares Mae Nuera
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="mb-3 text-xs text-stone-500">
                        Scan to pay via GCash
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://gasrncdfxphcxiwjevzl.supabase.co/storage/v1/object/public/announcemet_attachments/760938713_1614840956643997_6791671717786918740_n.jpg"
                        alt="GCash QR Code"
                        className="mx-auto max-w-[280px] rounded-xl border border-stone-200"
                      />
                    </div>
                  </div>

                  {!bookingSubmitted ? (
                    <>
                      <div className="rounded-2xl border border-[#F36509]/20 bg-[#F36509]/[0.04] p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <Info className="h-4 w-4 text-[#F36509]" />
                          <h3 className="text-sm font-semibold text-stone-900">
                            What happens next
                          </h3>
                        </div>
                        <ol className="space-y-2 text-sm text-stone-700">
                          <li>
                            1. Submit this reservation request (we also email
                            you the bill and QR).
                          </li>
                          <li>
                            2. Pay the 50% fee
                            {bill.deposit > 0
                              ? ` (${formatPHP(bill.deposit)})`
                              : ""}{" "}
                            via GCash using the details above.
                          </li>
                          <li>
                            3. Upload your receipt so we can verify and lock in
                            your booking.
                          </li>
                        </ol>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={goBack}
                          disabled={isSubmitting}
                          className="h-12 rounded-full border-stone-200 sm:w-auto"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          disabled={isSubmitting}
                          onClick={handleSubmitBooking}
                          className="h-12 flex-1 rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : "Submit reservation request"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                          Cancellation snapshot
                        </h4>
                        <ul className="space-y-1.5 text-xs text-stone-600">
                          {cancellationTiers.map((t) => (
                            <li key={t.window}>
                              <strong>{t.window}:</strong> {t.rule}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button
                        type="button"
                        size="lg"
                        onClick={goNext}
                        className="h-12 w-full rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                      >
                        I&apos;ve paid — upload receipt
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* ─── STEP 4: Receipt ─── */}
              {step === 4 && (
                <form onSubmit={handleSubmitReceipt} className="space-y-8">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
                      <Receipt className="h-4.5 w-4.5 text-[#F36509]" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-stone-900">
                        Upload payment receipt
                      </h3>
                      <p className="text-sm text-stone-500">
                        Attach a clear photo or PDF of your transfer so we can
                        verify and confirm your booking.
                      </p>
                    </div>
                  </div>

                  {/* Prefilled guest chip */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                    Submitting as{" "}
                    <strong className="text-stone-900">{formData.name}</strong>{" "}
                    · {formData.email}
                    {formData.phone ? ` · ${formData.phone}` : ""}
                  </div>

                  {/* Upload */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className={labelClass}>
                        <Upload className="h-3.5 w-3.5" />
                        Receipt file
                      </Label>
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-500">
                        Required · Max 8 MB
                      </span>
                    </div>

                    {!receiptFile ? (
                      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/80 px-6 py-10 transition hover:border-[#F36509]/40 hover:bg-[#F36509]/[0.03]">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-stone-200">
                          <FileImage className="h-5 w-5 text-[#F36509]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-stone-800">
                            Tap to upload receipt
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            JPG, PNG, WEBP, HEIC, or PDF
                          </p>
                        </div>
                        <input
                          ref={receiptInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                          onChange={onReceiptFileChange}
                          className="sr-only"
                        />
                      </label>
                    ) : (
                      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                        {receiptPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="max-h-72 w-full object-contain bg-white"
                          />
                        ) : (
                          <div className="flex items-center gap-3 px-5 py-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200">
                              <Receipt className="h-5 w-5 text-[#F36509]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-stone-900">
                                {receiptFile.name}
                              </p>
                              <p className="text-xs text-stone-500">
                                {(receiptFile.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={clearReceiptFile}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow-md ring-1 ring-stone-200 transition hover:text-[#F36509]"
                          aria-label="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        <Wallet className="h-3.5 w-3.5" />
                        Amount paid
                      </Label>
                      <Input
                        type="text"
                        value={receiptAmount}
                        onChange={(e) => setReceiptAmount(e.target.value)}
                        placeholder="e.g. 1500"
                        required
                        inputMode="decimal"
                        className={fieldClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Payment method</Label>
                      <select
                        value={receiptMethod}
                        onChange={(e) => setReceiptMethod(e.target.value)}
                        required
                        className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-stone-900 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                      >
                        {paymentMethods.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>
                      <MessageSquare className="h-3.5 w-3.5" />
                      Notes
                    </Label>
                    <textarea
                      value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)}
                      rows={3}
                      placeholder="Anything else about this payment…"
                      className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={goBack}
                      disabled={isSubmittingReceipt}
                      className="h-12 rounded-full border-stone-200 sm:w-auto"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmittingReceipt}
                      className="h-12 flex-1 rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                    >
                      {isSubmittingReceipt
                        ? "Submitting..."
                        : "Submit payment receipt"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
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

  useEffect(() => {
    if (!selectedWorkRoomId) return;
    const found = rooms.findIndex((r) =>
      r.capacities.some((c) => c.id === selectedWorkRoomId),
    );
    if (found >= 0) setIndex(found);
  }, [selectedWorkRoomId, rooms]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
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
                        {formatPHP(rate.price)}
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
