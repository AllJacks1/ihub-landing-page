"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Phone,
  Info,
  User,
  MessageSquare,
  Receipt,
  Upload,
  FileImage,
  X,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { submitPaymentReceipt } from "../actions/booking";

const paymentMethods = [
  { value: "GCash", label: "GCash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Other", label: "Other" },
];

const emptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  amountPaid: "",
  paymentMethod: "GCash",
  notes: "",
});

export default function SubmitReceiptPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldClass =
    "h-12 rounded-xl border-stone-200 bg-white px-4 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]/20";
  const labelClass =
    "flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
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
    setFile(next);
    if (next.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(next));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please attach your payment receipt.");
      return;
    }
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    if (!formData.amountPaid.trim()) {
      toast.error("Please enter the amount you paid.");
      return;
    }

    setIsSubmitting(true);

    const fd = new FormData();
    fd.set("name", formData.name.trim());
    fd.set("email", formData.email.trim());
    fd.set("phone", formData.phone.trim());
    fd.set("amountPaid", formData.amountPaid.trim());
    fd.set("paymentMethod", formData.paymentMethod);
    fd.set("notes", formData.notes.trim());
    fd.set("receipt", file);

    const result = await submitPaymentReceipt(fd);

    if (result.success) {
      toast.success("Receipt submitted successfully!", {
        description:
          "We've emailed a copy to our team and sent you a confirmation. We'll verify and confirm your booking shortly.",
        duration: 7000,
      });
      clearFile();
      setFormData(emptyForm());
    } else {
      toast.error("Failed to submit receipt", {
        description:
          result.message || "Please try again or call us at 0985 571 3768",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
        <Image
          src="/images/bistroThumbnail.png"
          alt="Submit Payment Receipt — iHub"
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
            PAYMENT
          </Badge>

          <h1 className="mb-4 font-serif text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Submit Your Receipt
          </h1>

          <p className="mx-auto max-w-lg text-lg leading-relaxed text-white/75">
            Already paid the 50% reservation fee? Upload your GCash or bank
            receipt so we can verify and confirm your booking.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <Card className="overflow-hidden border-stone-200/80 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
                    <Receipt className="h-4.5 w-4.5 text-[#F36509]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-stone-900">
                      Payment receipt
                    </h3>
                    <p className="text-sm text-stone-500">
                      Attach a clear photo or PDF of your transfer. We&apos;ll
                      email confirmation to you and notify the iHub team.
                    </p>
                  </div>
                </div>

                {/* Upload zone */}
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

                  {!file ? (
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
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                        onChange={onFileChange}
                        className="sr-only"
                      />
                    </label>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewUrl}
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
                              {file.name}
                            </p>
                            <p className="text-xs text-stone-500">
                              {(file.size / 1024).toFixed(0)} KB ·{" "}
                              {file.type || "file"}
                            </p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearFile}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-stone-600 shadow-md ring-1 ring-stone-200 transition hover:text-[#F36509]"
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {previewUrl && (
                        <div className="border-t border-stone-100 bg-white px-4 py-2.5">
                          <p className="truncate text-xs text-stone-500">
                            {file.name} · {(file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                  <p className="text-[11px] text-stone-400">
                    Use the same email from your reservation request so we can
                    match your payment.
                  </p>
                </div>

                {/* Payment */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>
                      <Wallet className="h-3.5 w-3.5" />
                      Amount paid
                    </Label>
                    <Input
                      type="text"
                      name="amountPaid"
                      value={formData.amountPaid}
                      onChange={handleChange}
                      placeholder="e.g. 1500"
                      required
                      inputMode="decimal"
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>Payment method</Label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
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

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className={labelClass}>
                    <MessageSquare className="h-3.5 w-3.5" />
                    Notes
                  </Label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Anything else we should know about this payment…"
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#F36509] focus:outline-none focus:ring-2 focus:ring-[#F36509]/20"
                  />
                </div>

                {/* What happens next */}
                <div className="rounded-2xl border border-[#F36509]/20 bg-[#F36509]/[0.04] p-5 sm:p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Info className="h-4 w-4 text-[#F36509]" />
                    <h3 className="text-sm font-semibold text-stone-900">
                      What happens after you submit
                    </h3>
                  </div>
                  <ol className="space-y-3 text-sm leading-relaxed text-stone-700">
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F36509] text-[11px] font-bold text-white">
                        1
                      </span>
                      <span>
                        Your receipt is emailed to the iHub team{" "}
                        <strong>with the file attached</strong>.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F36509] text-[11px] font-bold text-white">
                        2
                      </span>
                      <span>
                        You receive a confirmation email that we got your
                        receipt.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F36509] text-[11px] font-bold text-white">
                        3
                      </span>
                      <span>
                        After verification, we call or message you to{" "}
                        <strong>confirm and lock in</strong> your booking.
                      </span>
                    </li>
                  </ol>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 w-full rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md transition-all hover:bg-[#e05a00] hover:shadow-lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Payment Receipt"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <p className="text-center text-xs text-stone-400">
                  Prefer to message us? Send your receipt to{" "}
                  <a
                    href="tel:09855713768"
                    className="font-semibold text-[#F36509] hover:underline"
                  >
                    0985 571 3768
                  </a>{" "}
                  or{" "}
                  <a
                    href="mailto:ihubdavao@gmail.com"
                    className="font-semibold text-[#F36509] hover:underline"
                  >
                    ihubdavao@gmail.com
                  </a>
                  .
                </p>
              </form>
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
