"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signUpUser } from "@/app/actions/users";

interface FormState {
  userId: string;
  firstname: string;
  surname: string;
  birthday: string;
  contact: string;
  address: string;
  email: string;
  referral: string;
}

export default function SignUpForm() {
  const [form, setForm] = useState<FormState>({
    userId: "",
    firstname: "",
    surname: "",
    birthday: "",
    contact: "",
    address: "",
    email: "",
    referral: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ email: "", secret: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignUp = async () => {
    if (isCreating) return;

    // Basic validation
    if (
      !form.userId.trim() ||
      !form.firstname.trim() ||
      !form.surname.trim() ||
      !form.birthday ||
      !form.contact.trim() ||
      !form.address.trim() ||
      !form.email.trim()
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsCreating(true);

    try {
      const { success, account, error } = await signUpUser({
        userId: form.userId.trim(),
        firstname: form.firstname.trim(),
        surname: form.surname.trim(),
        birthday: form.birthday,
        contactNumber: form.contact.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        referralCode: form.referral.trim() || undefined,
      });

      if (success && account) {
        setAccountInfo({
          email: account.email,
          secret: account.secret,
        });
        setModalOpen(true);

        // Optional: reset form
        setForm({
          userId: "",
          firstname: "",
          surname: "",
          birthday: "",
          contact: "",
          address: "",
          email: "",
          referral: "",
        });
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
              Create an Account
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Fill in the details below to register a new member
            </p>
          </div>

          <Card className="border-stone-200 bg-white shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-5">
                {/* User ID */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="userId"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="userId"
                      placeholder="Enter unique user ID"
                      value={form.userId}
                      onChange={(e) => handleChange("userId", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Name row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="firstname"
                      className="text-xs font-medium uppercase tracking-wider text-stone-500"
                    >
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <Input
                        id="firstname"
                        placeholder="First name"
                        value={form.firstname}
                        onChange={(e) =>
                          handleChange("firstname", e.target.value)
                        }
                        className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="surname"
                      className="text-xs font-medium uppercase tracking-wider text-stone-500"
                    >
                      Surname <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="surname"
                      placeholder="Surname"
                      value={form.surname}
                      onChange={(e) => handleChange("surname", e.target.value)}
                      className="rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Birthday */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="birthday"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    Birthday <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="birthday"
                      type="date"
                      value={form.birthday}
                      onChange={(e) => handleChange("birthday", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="contact"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="contact"
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
                  <Label
                    htmlFor="address"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="address"
                      placeholder="Full address"
                      value={form.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
                    />
                  </div>
                </div>

                {/* Referral */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="referral"
                    className="text-xs font-medium uppercase tracking-wider text-stone-500"
                  >
                    Referral Code{" "}
                    <span className="normal-case text-stone-400">
                      (optional)
                    </span>
                  </Label>
                  <div className="relative">
                    <Gift className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <Input
                      id="referral"
                      placeholder="Enter referral code"
                      maxLength={10}
                      value={form.referral}
                      onChange={(e) => handleChange("referral", e.target.value)}
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
                <code className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold tracking-wide text-[#F36509] border border-stone-200">
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
