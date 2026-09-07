"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  Ticket,
  Gift,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signUpSponsoredUser } from "@/app/actions/users";

const INITIAL_FORM_STATE = {
  userId: "",
  firstName: "",
  lastName: "",
  birthday: "",
  contact: "",
  address: "",
  email: "",
  sponsorshipVoucher: "",
  voucherCode: "",
};

export default function SponsorshipSignUpForm() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [modalOpen, setModalOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ email: "", secret: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (
    key: keyof typeof INITIAL_FORM_STATE,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignUp = async () => {
    if (isCreating) return;

    if (
      !form.userId.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.birthday ||
      !form.contact.trim() ||
      !form.address.trim() ||
      !form.email.trim() ||
      !form.sponsorshipVoucher ||
      !form.voucherCode.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsCreating(true);

    try {
      const { success, account, error } = await signUpSponsoredUser({
        userId: form.userId.trim(),
        firstname: form.firstName.trim(),
        surname: form.lastName.trim(),
        birthday: form.birthday,
        contactNumber: form.contact.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        sponsorshipVoucher: form.sponsorshipVoucher,
        voucherCode: form.voucherCode.trim(),
      });

      if (success && account) {
        setAccountInfo({ email: account.email, secret: account.secret });
        setModalOpen(true);
        setForm(INITIAL_FORM_STATE);
      } else {
        toast.error(error || "Signup failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(accountInfo.secret);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <>
      <main className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
              Sponsorship Registration
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Register a new member using a sponsorship voucher
            </p>
          </div>

          <Card className="border-stone-200 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-5">
                {/* User ID */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      placeholder="User ID from CRM"
                      value={form.userId}
                      onChange={(e) => handleChange("userId", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Name row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        placeholder="e.g. Juan Miguel"
                        value={form.firstName}
                        onChange={(e) =>
                          handleChange("firstName", e.target.value)
                        }
                        className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. Santos"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className="rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Birthday <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="date"
                      value={form.birthday}
                      onChange={(e) => handleChange("birthday", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="tel"
                      placeholder="e.g. 09123456789"
                      value={form.contact}
                      onChange={(e) => handleChange("contact", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Complete Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      placeholder="Complete address"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Sponsorship Voucher */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Sponsorship Voucher <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.sponsorshipVoucher}
                    onValueChange={(v) =>
                      handleChange("sponsorshipVoucher", v ?? "")
                    }
                  >
                    <SelectTrigger className="rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-stone-400" />
                        <SelectValue placeholder="Select a voucher" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5-hour-iaccess-sponsorship-voucher">
                        5-Hour iAccess Sponsorship Voucher
                      </SelectItem>
                      <SelectItem value="10-hour-iaccess-sponsorship-voucher">
                        10-Hour iAccess Sponsorship Voucher
                      </SelectItem>
                      <SelectItem value="20-hour-iaccess-sponsorship-voucher">
                        20-Hour iAccess Sponsorship Voucher
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voucher Code */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                    Voucher Code <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Gift className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      placeholder="Enter voucher code"
                      value={form.voucherCode}
                      onChange={(e) =>
                        handleChange("voucherCode", e.target.value)
                      }
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSignUp}
                disabled={isCreating}
                className="mt-8 w-full bg-[#F36509] py-5 text-white hover:bg-[#e05a00]"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Success Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogTitle className="font-serif text-xl">
              Account Created!
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              Share these credentials with the new member. The password is only
              shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Email
              </p>
              <p className="mt-0.5 text-sm font-medium text-stone-900">
                {accountInfo.email}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Temporary Password
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-sm font-semibold tracking-wide text-[#F36509]">
                  {accountInfo.secret}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                  className="h-8 shrink-0 border-stone-200"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setModalOpen(false)}
              className="w-full bg-[#F36509] text-white hover:bg-[#e05a00]"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
