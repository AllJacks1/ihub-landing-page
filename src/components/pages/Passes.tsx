"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Zap,
  Star,
  Building,
  Coffee,
  Printer,
  Sparkles,
  ChevronDown,
  Award,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { submitPassRequest } from "@/app/actions/passes";

interface PassesPageProps {
  onBackToHome?: () => void;
}

const partnerLogos = [
  {
    name: "J-MaVe Cars",
    category: "Automotive & Fleet",
    desc: "5% discount on vehicle services & rentals",
  },
  {
    name: "Astria Insurance Solutions",
    category: "Insurance & Risk",
    desc: "5% discount on personal & property insurance",
  },
  {
    name: "Axial Real Estate Services",
    category: "Property & Spaces",
    desc: "5% discount on lease & space management",
  },
  {
    name: "Axis Marketing Solutions",
    category: "Marketing & Creative",
    desc: "5% discount on branding & digital marketing",
  },
  {
    name: "Avaris Sales Solutions",
    category: "Business Growth",
    desc: "5% discount on sales strategy & outsourcing",
  },
  {
    name: "Aivox Tech",
    category: "IT & Software",
    desc: "5% discount on custom tech & web solutions",
  },
  {
    name: "OneHub Document Processing",
    category: "Corporate & Permits",
    desc: "5% discount on business registration & permits",
  },
  {
    name: "Morales Law",
    category: "Legal Services",
    desc: "5% discount on retainer & legal consultation",
  },
];

export default function PassesPage({ onBackToHome }: PassesPageProps) {
  const [activeTab, setActiveTab] = useState<"all" | "annual" | "passes">(
    "all",
  );
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    packageId: string;
    packageName: string;
    packagePrice: string;
    packageNote?: string;
  } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const openBookingModal = (pkg: {
    packageId: string;
    packageName: string;
    packagePrice: string;
    packageNote?: string;
  }) => {
    setSelectedPackage(pkg);
    setName("");
    setEmail("");
    setPhone("");
    setErrors({});
    setIsSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // small delay so animation can finish before resetting success state
    setTimeout(() => {
      setIsSuccess(false);
      setName("");
      setEmail("");
      setErrors({});
    }, 200);
  };

  const validate = () => {
    const nextErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim()) nextErrors.name = "Name is required";
    if (!email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }
    if (!phone.trim()) nextErrors.phone = "Phone is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedPackage) return;

    setIsSubmitting(true);

    try {
      const result = await submitPassRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        packageId: selectedPackage.packageId,
        packageName: selectedPackage.packageName,
        packagePrice: selectedPackage.packagePrice,
        packageNote: selectedPackage.packageNote,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      //toast.success(result.message || "Pass request sent successfully!");
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 pt-44 pb-20 px-4 sm:px-6 lg:px-8 selection:bg-[#F36509] selection:text-white">
      {/* Hero Campaign Header */}
      <div className="relative mx-auto max-w-7xl mb-16 text-center">
        {/* Soft ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-[#F36509]/08 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F36509]/10 border border-[#F36509]/25 text-[#F36509] text-xs font-mono font-bold tracking-widest mb-4 uppercase">
            <Sparkles className="h-3.5 w-3.5" /> AUGUST ADVANTAGE 2026 •
            MEMORANDUM AG-2026-08-001
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-stone-900 mb-6">
            One Visit. <span className="text-[#F36509]">More Benefits.</span>
          </h1>

          <p className="mx-auto max-w-3xl text-base sm:text-xl text-stone-600 leading-relaxed mb-8">
            Explore official annual{" "}
            <strong className="text-stone-900">
              iAccess Membership Passes
            </strong>{" "}
            and daily/monthly{" "}
            <strong className="text-stone-900">iStudy Passes</strong>. Unlock
            member rates, café & printing discounts, and 5% exclusive savings
            across all 8 Astra Group partner businesses.
          </p>

          {/* Quick Filter Switcher */}
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-white border border-stone-200 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#F36509] text-white shadow-md shadow-orange-500/20"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              All Passes & Memberships
            </button>
            <button
              onClick={() => setActiveTab("annual")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "annual"
                  ? "bg-[#F36509] text-white shadow-md shadow-orange-500/20"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              iAccess Annual Membership
            </button>
            <button
              onClick={() => setActiveTab("passes")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "passes"
                  ? "bg-[#F36509] text-white shadow-md shadow-orange-500/20"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              iStudy Passes (Hourly & Monthly)
            </button>
          </div>
        </motion.div>
      </div>

      {/* SECTION 1: iAccess Annual Membership Tiers */}
      {(activeTab === "all" || activeTab === "annual") && (
        <section className="mx-auto max-w-7xl mb-24">
          <div className="mb-10 text-center">
            <Badge
              variant="outline"
              className="mb-3 border-stone-200 bg-white px-3 py-1 text-xs font-mono font-bold text-[#F36509] uppercase"
            >
              1-YEAR ANNUAL MEMBERSHIPS
            </Badge>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 mb-3">
              iAccess Membership Passes
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto text-sm sm:text-base">
              Annual tiers granting member pricing, lounge access hours, café &
              printing discounts, and cross-business perks.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 items-stretch">
            {/* Standard Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full flex flex-col justify-between border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md transition-all">
                <CardHeader className="p-6 sm:p-8 pb-4">
                  <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-stone-400">
                    FOR STUDENTS & CASUAL USERS
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1">
                    iAccess Standard
                  </h3>
                  <p className="text-xs text-stone-500 min-h-[36px]">
                    Your gateway to the iHub community and Astra partner perks.
                  </p>

                  <div className="mt-6 mb-2 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
                      ₱299
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      / year
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-600 font-semibold">
                    1 Named Member • 1 Year Validity
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3 border-t border-stone-100 pt-6 text-xs sm:text-sm text-stone-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          10 Coworking Hours
                        </strong>{" "}
                        in iHub & iHub Xpress
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          10% Café & Printing
                        </strong>{" "}
                        Discount
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>Member Pricing on all iHub Products</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          5% Astra Group
                        </strong>{" "}
                        Partner Discounts
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>Birthday Coffee Treat & Priority Event Perks</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() =>
                      openBookingModal({
                        packageId: "iaccess-standard",
                        packageName: "iAccess Standard",
                        packagePrice: "₱299 / year",
                        packageNote: "1 Named Member • 10 Coworking Hours",
                      })
                    }
                    className="w-full h-12 rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:border-[#F36509] hover:text-[#F36509] font-semibold text-sm transition-all cursor-pointer"
                  >
                    Get Standard Pass (₱299/yr)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium Tier (Featured) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="relative h-full flex flex-col justify-between border-[#F36509]/50 bg-white shadow-lg shadow-orange-500/10 ring-1 ring-[#F36509]/20 hover:-translate-y-1 transition-all">
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#F36509] text-white text-[10px] font-mono font-bold tracking-widest shadow-md uppercase leading-tight text-center">
                  <div>MOST POPULAR</div>
                  <div className="text-[8px] opacity-90">BEST VALUE</div>
                </div>

                <CardHeader className="p-6 sm:p-8 pb-4 pt-8">
                  <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-[#F36509]">
                    FOR PROFESSIONALS & CREATORS
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1 flex items-center justify-between">
                    iAccess Premium
                    <Star className="h-5 w-5 text-[#F36509] fill-[#F36509]" />
                  </h3>
                  <p className="text-xs text-stone-500 min-h-[36px]">
                    Designed for professionals who work, meet, and create
                    regularly.
                  </p>

                  <div className="mt-6 mb-2 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
                      ₱599
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      / year
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#F36509] font-semibold">
                    1 Named Member • 1 Year Validity
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3 border-t border-stone-100 pt-6 text-xs sm:text-sm text-stone-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          30 Coworking Hours
                        </strong>{" "}
                        (Triple the standard)
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          2 Hours Meeting Room
                        </strong>{" "}
                        Credits
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          2 Guest Passes
                        </strong>{" "}
                        included
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>Exclusive Networking Nights Access</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        10% Café & Printing + 5% Astra Partner Savings
                      </span>
                    </li>
                  </ul>

                  <Button
                    onClick={() =>
                      openBookingModal({
                        packageId: "iaccess-premium",
                        packageName: "iAccess Premium",
                        packagePrice: "₱599 / year",
                        packageNote:
                          "1 Named Member • 30 Coworking Hours + 2 Meeting Room Hours",
                      })
                    }
                    className="w-full h-12 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00] font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    Get Premium Pass (₱599/yr)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Corporate Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-full flex flex-col justify-between border-stone-200 bg-white shadow-sm hover:border-stone-300 hover:shadow-md transition-all">
                <CardHeader className="p-6 sm:p-8 pb-4">
                  <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-indigo-500">
                    FOR SMES, TEAMS & BUSINESSES
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1 flex items-center justify-between">
                    iAccess Corporate
                    <Building className="h-5 w-5 text-indigo-500" />
                  </h3>
                  <p className="text-xs text-stone-500 min-h-[36px]">
                    Flexible workspace membership for growing teams &
                    organizations.
                  </p>

                  <div className="mt-6 mb-2 flex items-baseline gap-1">
                    <span className="font-serif text-4xl sm:text-5xl font-bold text-stone-900">
                      ₱2,999
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      / year
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-500 font-semibold">
                    4 Named Team Members • 1 Year Validity
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 pt-0 flex-1 flex flex-col justify-between space-y-6">
                  <ul className="space-y-3 border-t border-stone-100 pt-6 text-xs sm:text-sm text-stone-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          80 Shared Coworking Hours
                        </strong>{" "}
                        for team
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          4 Hours Meeting Room
                        </strong>{" "}
                        Credits
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-stone-900">
                          60 Pages Free Printing
                        </strong>{" "}
                        Credits
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>
                        4 Shared Guest Passes & Business Directory Listing
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-[#F36509] shrink-0 mt-0.5" />
                      <span>Priority Reservations & Corporate Networking</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() =>
                      openBookingModal({
                        packageId: "iaccess-corporate",
                        packageName: "iAccess Corporate",
                        packagePrice: "₱2,999 / year",
                        packageNote: "4 Named Team Members • 80 Shared Hours",
                      })
                    }
                    className="w-full h-12 rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:border-[#F36509] hover:text-[#F36509] font-semibold text-sm transition-all cursor-pointer"
                  >
                    Get Corporate Pass (₱2,999/yr)
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* SECTION 2: iStudy Passes */}
      {(activeTab === "all" || activeTab === "passes") && (
        <section className="mx-auto max-w-7xl mb-24">
          <div className="mb-10 text-center">
            <Badge
              variant="outline"
              className="mb-3 border-amber-200 bg-amber-50 px-3 py-1 text-xs font-mono font-bold text-amber-600 uppercase"
            >
              STUDY & WORK PASSES
            </Badge>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 mb-3">
              iStudy Productivity Passes
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto text-sm sm:text-base">
              Hourly and unlimited monthly options crafted for intense study,
              research, and deep work.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* iStudy Productivity Pass (Hourly) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="h-full border-stone-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-mono font-bold uppercase">
                      AUGUST PROMO RATE
                    </span>
                    <span className="text-xs text-stone-400 line-through">
                      Regular ₱60/hr
                    </span>
                  </div>

                  <h3 className="font-serif text-3xl font-bold text-stone-900 mb-2">
                    iStudy Productivity Pass
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    Hourly access perfect for quick study sessions, online
                    exams, or deep focus work.
                  </p>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="font-serif text-5xl font-bold text-amber-500">
                      ₱50
                    </span>
                    <span className="text-sm font-mono text-stone-400">
                      / hour
                    </span>
                  </div>

                  <div className="space-y-3.5 border-t border-stone-100 pt-6 mb-8 text-sm text-stone-600">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                        <Coffee className="h-4 w-4" />
                      </div>
                      <span>
                        <strong className="text-stone-900">
                          One (1) Round Brewed Coffee
                        </strong>{" "}
                        included
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span>
                        600 Mbps Ultra-fast WiFi & Dedicated Charging Outlets
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500">
                        <Printer className="h-4 w-4" />
                      </div>
                      <span>
                        <strong className="text-stone-900">
                          10% Printing Discount
                        </strong>{" "}
                        & 10% Café Discount
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => (window.location.href = "/booking")}
                  className="w-full h-12 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 font-bold text-sm transition-all cursor-pointer"
                >
                  Book Hourly Session (₱50/hr)
                </Button>
              </Card>
            </motion.div>

            {/* iStudy Unlimited Pass (Monthly) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="relative h-full border-[#F36509]/40 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-md shadow-orange-500/10 hover:border-[#F36509] transition-all">
                <div className="absolute top-1.5 right-6 px-3 py-1 rounded-full bg-[#F36509] text-white text-[10px] font-mono font-bold uppercase">
                  UNLIMITED MONTHLY ACCESS
                </div>

                <div>
                  <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#F36509]/10 border border-[#F36509]/25 text-[#F36509] text-xs font-mono font-bold uppercase">
                      INCLUDES iACCESS STANDARD
                    </span>
                  </div>

                  <h3 className="font-serif text-3xl font-bold text-stone-900 mb-2">
                    iStudy Unlimited Pass
                  </h3>
                  <p className="text-sm text-stone-500 mb-6">
                    For daily power users, freelancers, and students who need
                    seamless 24/7 access.
                  </p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-5xl font-bold text-stone-900">
                        ₱3,000
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        1st month
                      </span>
                    </div>
                    <div className="mt-1 text-xs font-mono text-[#F36509] font-bold">
                      Renewal Rate: Only ₱2,500 / month
                    </div>
                  </div>

                  <div className="space-y-3.5 border-t border-stone-100 pt-6 mb-8 text-sm text-stone-600">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#F36509]" />
                      <span>
                        <strong className="text-stone-900">
                          Unlimited 24/7 Coworking
                        </strong>{" "}
                        access in all zones
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#F36509]" />
                      <span>
                        <strong className="text-stone-900">
                          Automatic iAccess Standard Membership
                        </strong>{" "}
                        (₱299 value)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#F36509]" />
                      <span>10% Café Discount & 10% Printing Discount</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-[#F36509]" />
                      <span>
                        5% Astra Group Partner Discounts & Birthday Coffee
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    openBookingModal({
                      packageId: "istudy-unlimited",
                      packageName: "iStudy Unlimited Pass",
                      packagePrice: "₱3,000 (1st month) → ₱2,500 renewal",
                      packageNote:
                        "Unlimited 24/7 access + automatic iAccess Standard",
                    })
                  }
                  className="w-full h-12 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00] font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Subscribe Unlimited (₱3,000)
                </Button>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* SECTION 3: Comparison Table */}
      <section className="mx-auto max-w-7xl mb-24 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-stone-200 bg-white px-3 py-1 text-xs font-mono font-bold text-stone-500 uppercase"
          >
            Detailed Feature Comparison
          </Badge>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-3">
            iAccess Tiers Side-by-Side
          </h2>
          <p className="text-stone-500 max-w-xl mx-auto text-sm sm:text-base">
            Directly compare features, credits, and privileges across all three
            annual membership levels.
          </p>
        </div>

        {/* ─── MOBILE & TABLET: Plan Cards (< lg) ─── */}
        <div className="lg:hidden grid gap-6 md:grid-cols-3">
          {/* Standard */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-stone-900">
                iAccess Standard
              </h3>
              <div className="mt-1 text-2xl font-bold text-stone-900">
                ₱299
                <span className="text-sm font-normal text-stone-500">/yr</span>
              </div>
            </div>
            <ul className="divide-y divide-stone-100 text-sm">
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Named Members</span>
                <span className="font-semibold text-stone-900">1 Member</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Validity</span>
                <span className="font-semibold text-stone-900">1 Year</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Coworking Hours</span>
                <span className="font-semibold text-stone-900">10 Hours</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Meeting Room Credits</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Printing Credits</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Café & Printing Discount</span>
                <span className="font-bold text-stone-800">10% Off</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Astra Partner Discounts</span>
                <span className="font-bold text-emerald-600">5% Across 8</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Guest Passes</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Business Directory</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Networking Nights</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Birthday Coffee & Perks</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </li>
            </ul>
          </div>

          {/* Premium — Highlighted */}
          <div className="rounded-2xl border-2 border-[#F36509] bg-white shadow-lg shadow-orange-500/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 bg-[#F36509] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Most Popular
            </div>
            <div className="p-5 border-b border-orange-100 bg-[#F36509]/[0.03]">
              <h3 className="font-serif text-lg font-bold text-[#F36509]">
                iAccess Premium
              </h3>
              <div className="mt-1 text-2xl font-bold text-[#F36509]">
                ₱599
                <span className="text-sm font-normal text-stone-500">/yr</span>
              </div>
            </div>
            <ul className="divide-y divide-orange-50 text-sm">
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Named Members</span>
                <span className="font-bold text-stone-900">1 Member</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Validity</span>
                <span className="font-bold text-stone-900">1 Year</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Coworking Hours</span>
                <span className="font-bold text-[#F36509]">30 Hours</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Meeting Room Credits</span>
                <span className="font-bold text-stone-900">2 Hours</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Printing Credits</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Café & Printing Discount</span>
                <span className="font-bold text-[#F36509]">10% Off</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Astra Partner Discounts</span>
                <span className="font-bold text-emerald-600">5% Across 8</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Guest Passes</span>
                <span className="font-bold text-stone-900">2 Passes</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Business Directory</span>
                <span className="text-stone-400">—</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Networking Nights</span>
                <span className="font-bold text-stone-900">Included ✓</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Birthday Coffee & Perks</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </li>
            </ul>
          </div>

          {/* Corporate */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100">
              <h3 className="font-serif text-lg font-bold text-indigo-600">
                iAccess Corporate
              </h3>
              <div className="mt-1 text-2xl font-bold text-indigo-600">
                ₱2,999
                <span className="text-sm font-normal text-stone-500">/yr</span>
              </div>
            </div>
            <ul className="divide-y divide-stone-100 text-sm">
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Named Members</span>
                <span className="font-semibold text-indigo-600">4 Members</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Validity</span>
                <span className="font-semibold text-stone-900">1 Year</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Coworking Hours</span>
                <span className="font-semibold text-indigo-600">
                  80 Shared Hours
                </span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Meeting Room Credits</span>
                <span className="font-semibold text-indigo-600">4 Hours</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Printing Credits</span>
                <span className="font-semibold text-emerald-600">60 Pages</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Café & Printing Discount</span>
                <span className="font-bold text-stone-800">10% Off</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Astra Partner Discounts</span>
                <span className="font-bold text-emerald-600">5% Across 8</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Guest Passes</span>
                <span className="font-semibold text-indigo-600">
                  4 Shared Passes
                </span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Business Directory</span>
                <span className="text-emerald-600 font-bold">Included ✓</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Networking Nights</span>
                <span className="font-bold text-stone-900">Included ✓</span>
              </li>
              <li className="flex justify-between p-4">
                <span className="text-stone-500">Birthday Coffee & Perks</span>
                <span className="text-emerald-600 font-bold">✓</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── DESKTOP: Full Comparison Table (lg+) ─── */}
        <div className="hidden lg:block overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="p-6 text-sm font-serif font-bold text-stone-900 sticky left-0 bg-stone-50 z-10">
                  Feature
                </th>
                <th className="p-6 text-sm font-bold text-stone-700">
                  iAccess Standard
                  <div className="text-xs font-mono font-normal text-[#F36509] mt-0.5">
                    ₱299/yr
                  </div>
                </th>
                <th className="p-6 text-sm font-bold text-[#F36509] bg-[#F36509]/[0.08] relative">
                  iAccess Premium
                  <span className="absolute top-0 right-0 bg-[#F36509] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg">
                    Popular
                  </span>
                  <div className="text-xs font-mono font-normal text-stone-600 mt-0.5">
                    ₱599/yr
                  </div>
                </th>
                <th className="p-6 text-sm font-bold text-indigo-600">
                  iAccess Corporate
                  <div className="text-xs font-mono font-normal text-indigo-400 mt-0.5">
                    ₱2,999/yr
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm text-stone-600">
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Named Members
                </td>
                <td className="p-5">1 Member</td>
                <td className="p-5 font-bold text-stone-900 bg-[#F36509]/[0.05]">
                  1 Member
                </td>
                <td className="p-5 font-semibold text-indigo-600">4 Members</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Validity
                </td>
                <td className="p-5">1 Year</td>
                <td className="p-5 font-bold text-stone-900 bg-[#F36509]/[0.05]">
                  1 Year
                </td>
                <td className="p-5">1 Year</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Coworking Hours
                </td>
                <td className="p-5 font-semibold text-stone-700">10 Hours</td>
                <td className="p-5 font-bold text-[#F36509] bg-[#F36509]/[0.05]">
                  30 Hours
                </td>
                <td className="p-5 font-semibold text-indigo-600">
                  80 Shared Hours
                </td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Meeting Room Credits
                </td>
                <td className="p-5 text-stone-400">—</td>
                <td className="p-5 font-bold text-stone-900 bg-[#F36509]/[0.05]">
                  2 Hours
                </td>
                <td className="p-5 font-semibold text-indigo-600">4 Hours</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Printing Credits
                </td>
                <td className="p-5 text-stone-400">—</td>
                <td className="p-5 text-stone-400 bg-[#F36509]/[0.05]">—</td>
                <td className="p-5 font-semibold text-emerald-600">60 Pages</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Café & Printing Discount
                </td>
                <td className="p-5 font-bold text-stone-800">10% Off</td>
                <td className="p-5 font-bold text-[#F36509] bg-[#F36509]/[0.05]">
                  10% Off
                </td>
                <td className="p-5 font-bold text-stone-800">10% Off</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Astra Partner Discounts
                </td>
                <td className="p-5 font-bold text-emerald-600">
                  5% Across 8 Partners
                </td>
                <td className="p-5 font-bold text-emerald-600 bg-[#F36509]/[0.05]">
                  5% Across 8 Partners
                </td>
                <td className="p-5 font-bold text-emerald-600">
                  5% Across 8 Partners
                </td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Guest Passes
                </td>
                <td className="p-5 text-stone-400">—</td>
                <td className="p-5 font-bold text-stone-900 bg-[#F36509]/[0.05]">
                  2 Guest Passes
                </td>
                <td className="p-5 font-semibold text-indigo-600">
                  4 Shared Passes
                </td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Business Directory Listing
                </td>
                <td className="p-5 text-stone-400">—</td>
                <td className="p-5 text-stone-400 bg-[#F36509]/[0.05]">—</td>
                <td className="p-5 text-emerald-600 font-bold">Included ✓</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Networking Nights
                </td>
                <td className="p-5 text-stone-400">—</td>
                <td className="p-5 font-bold text-stone-900 bg-[#F36509]/[0.05]">
                  Included ✓
                </td>
                <td className="p-5 font-bold text-stone-900">Included ✓</td>
              </tr>
              <tr className="hover:bg-stone-50/50 transition-colors">
                <td className="p-5 font-semibold text-stone-900 sticky left-0 bg-white hover:bg-stone-50/50 transition-colors">
                  Birthday Coffee & Priority Perks
                </td>
                <td className="p-5 text-emerald-600">✓</td>
                <td className="p-5 text-emerald-600 bg-[#F36509]/[0.05]">✓</td>
                <td className="p-5 text-emerald-600">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: Astra Group Partners */}
      <section className="mx-auto max-w-7xl mb-24">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-mono font-bold text-emerald-600 uppercase"
          >
            CROSS-BUSINESS VALUE ADD
          </Badge>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 mb-3">
            5% Discount Across Astra Group Partners
          </h2>
          <p className="text-stone-500 max-w-2xl mx-auto text-sm sm:text-base">
            As an iAccess Member, show your digital or physical member ID at any
            participating Astra Group business to enjoy an exclusive 5%
            discount.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {partnerLogos.map((partner, idx) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <Card className="h-full border-stone-200 bg-white p-5 rounded-2xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2 text-xs font-mono font-bold text-emerald-600 uppercase">
                  <Award className="h-3.5 w-3.5" /> {partner.category}
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
                  {partner.name}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {partner.desc}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 5: FAQs */}
      <section className="mx-auto max-w-4xl mb-16">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-bold text-stone-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-stone-500 text-sm">
            Everything you need to know about your iAccess & iStudy passes.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How do I activate and claim my 5% Astra partner discount?",
              a: "Upon purchasing any iAccess pass, you will receive a digital membership card or reference code. Simply present your active card or code at J-MaVe Cars, Astria Insurance, Axial Real Estate, Axis Marketing, Avaris Sales, Aivox Tech, OneHub, or Morales Law to receive your 5% discount instantly.",
            },
            {
              q: "Can Corporate Coworking hours be shared among team members?",
              a: "Yes! The 80 coworking hours in the iAccess Corporate Pass (₱2,999/yr) are shared among all 4 registered team members. Any registered member can consume hours when working at iHub or iHub Xpress lounges.",
            },
            {
              q: "What happens after the first month on the iStudy Unlimited Pass?",
              a: "Your initial month is ₱3,000. For subsequent continuous months, your renewal rate drops to only ₱2,500/month. Additionally, your pass automatically includes an active iAccess Standard annual membership!",
            },
            {
              q: "What is included with the ₱50/hr iStudy Productivity Pass promo?",
              a: "Our August Advantage 2026 promo includes 1 round of brewed coffee, 600 Mbps ultra-fast WiFi, dedicated power outlets, plus a 10% discount on all café food, beverages, and printing services during your stay.",
            },
          ].map((faq, index) => (
            <div
              key={index}
              className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-sm transition-all"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-5 text-left flex items-center justify-between font-serif font-bold text-stone-900 text-base sm:text-lg cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-5 w-5 text-[#F36509] transition-transform duration-300 ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expandedFaq === index && (
                <div className="px-5 pb-5 text-sm text-stone-600 leading-relaxed border-t border-stone-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-[#F36509] via-[#e05a00] to-amber-500 p-8 sm:p-12 text-center text-white shadow-xl shadow-orange-500/20">
        <h3 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
          Ready to experience the August Advantage?
        </h3>
        <p className="text-white/90 max-w-xl mx-auto text-sm sm:text-base mb-8">
          Join Davao&apos;s premier 24/7 coworking community. One visit opens
          doors to workspace, coffee, and Astra partner benefits.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => {
              window.location.href = "tel:+639855713768";
            }}
            className="h-14 px-8 rounded-full bg-white text-[#F36509] hover:bg-stone-100 font-bold text-base shadow-lg cursor-pointer"
          >
            Claim Your Pass Now
          </Button>
          <Link
            href="https://online.fliphtml5.com/mtvla/uhye/"
            target="_blank"
            rel="noopener noreferrer"
            className="h-14 px-8 rounded-full border-2 border-white text-white hover:bg-white/10 font-semibold text-base transition-colors cursor-pointer content-center"
          >
            Explore Bistro Menu
          </Link>
        </div>
      </div>

      {/* ===================== NAME + EMAIL MODAL ===================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              {isSuccess ? (
                /* Success state */
                <div className="p-8 sm:p-10 text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-7 w-7" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                    Thank you!
                  </h3>
                  <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                    We’ve received your details. Our team will reach out shortly
                    to complete your pass.
                  </p>
                  <Button
                    onClick={closeModal}
                    className="w-full h-12 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00] font-semibold text-sm cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                /* Form state */
                <div className="p-8 sm:p-10">
                  <div className="mb-6 pr-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F36509]/10 border border-[#F36509]/20 text-[#F36509] text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
                      <Sparkles className="h-3 w-3" /> Get Your Pass
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-stone-900 mb-1">
                      Almost there
                    </h3>
                    <p className="text-sm text-stone-500">
                      Enter your name and email so we can send your membership
                      details.
                    </p>
                  </div>

                  {/* Selected package summary */}
                  {selectedPackage && (
                    <div className="mb-6 rounded-2xl border border-[#F36509]/25 bg-[#F36509]/[0.04] px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F36509]/80">
                            Selected pass
                          </p>
                          <p className="mt-1 font-serif text-lg font-semibold text-stone-900">
                            {selectedPackage.packageName}
                          </p>
                          {selectedPackage.packageNote && (
                            <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">
                              {selectedPackage.packageNote}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-serif text-xl font-semibold text-stone-900">
                            {selectedPackage.packagePrice}
                          </p>
                          {selectedPackage.packagePrice && (
                            <p className="text-xs text-stone-400">
                              {selectedPackage.packagePrice}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                    noValidate
                  >
                    {/* Name */}
                    <div>
                      <label
                        htmlFor="pass-name"
                        className="block text-xs font-semibold text-stone-700 mb-1.5"
                      >
                        Full Name <span className="text-[#F36509]">*</span>
                      </label>
                      <input
                        id="pass-name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) {
                            setErrors((prev) => ({ ...prev, name: undefined }));
                          }
                        }}
                        placeholder="Juan Dela Cruz"
                        className={`w-full h-12 px-4 rounded-xl border bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:ring-2 focus:ring-[#F36509]/30 focus:border-[#F36509] ${
                          errors.name
                            ? "border-red-400 focus:ring-red-200"
                            : "border-stone-200"
                        }`}
                        autoComplete="name"
                      />
                      {errors.name && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="pass-email"
                        className="block text-xs font-semibold text-stone-700 mb-1.5"
                      >
                        Email Address <span className="text-[#F36509]">*</span>
                      </label>
                      <input
                        id="pass-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            setErrors((prev) => ({
                              ...prev,
                              email: undefined,
                            }));
                          }
                        }}
                        placeholder="you@example.com"
                        className={`w-full h-12 px-4 rounded-xl border bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:ring-2 focus:ring-[#F36509]/30 focus:border-[#F36509] ${
                          errors.email
                            ? "border-red-400 focus:ring-red-200"
                            : "border-stone-200"
                        }`}
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label
                        htmlFor="pass-phone"
                        className="block text-xs font-semibold text-stone-700 mb-1.5"
                      >
                        Phone Number <span className="text-[#F36509]">*</span>
                      </label>
                      <input
                        id="pass-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) {
                            setErrors((prev) => ({
                              ...prev,
                              phone: undefined,
                            }));
                          }
                        }}
                        placeholder="09XX XXX XXXX"
                        className={`w-full h-12 px-4 rounded-xl border bg-stone-50 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:ring-2 focus:ring-[#F36509]/30 focus:border-[#F36509] ${
                          errors.phone
                            ? "border-red-400 focus:ring-red-200"
                            : "border-stone-200"
                        }`}
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <p className="mt-1.5 text-xs text-red-500">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-12 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00] font-bold text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Submitting…" : "Continue"}
                    </Button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
