"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { loginUser } from "@/lib/actions";

export default function LoginModal() {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        toast.success("Login successful!", {
          description: "Welcome back to the dashboard.",
          duration: 3000,
        });

        setOpen(false);
        window.location.href = "/admin"; // Full refresh to load session
      } else {
        toast.error("Login failed", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div
          role="button"
          tabIndex={0}
          className="inline-flex items-center h-14 rounded-full border-2 border-stone-300 px-6 
    font-semibold text-stone-700 bg-white cursor-pointer select-none
    transition-all duration-200 ease-out
    hover:-translate-y-0.5 hover:border-[#F36509] hover:text-[#F36509] hover:shadow-md
    active:translate-y-0 active:scale-[0.98] active:shadow-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36509]/30 focus-visible:ring-offset-2"
        >
          <LogIn className="mr-2 h-4 w-4 shrink-0" />
          Login as Author
        </div>
      </DialogTrigger>

      <DialogContent className="overflow-hidden border-stone-200 bg-white p-0 sm:max-w-md">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#F36509] to-[#e05a00] px-8 pb-8 pt-10 text-center">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-semibold tracking-tight text-white">
              Author Login
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Access your dashboard to write and manage articles.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 px-8 pb-8 pt-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500"
            >
              <Mail className="h-3.5 w-3.5" />
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="author@ihubdavao.com"
              required
              className="h-14 rounded-2xl border-stone-200 bg-stone-50 px-5 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-500"
            >
              <Lock className="h-3.5 w-3.5" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                required
                className="h-14 rounded-2xl border-stone-200 bg-stone-50 px-5 pr-12 text-stone-900 placeholder:text-stone-400 focus:border-[#F36509]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 w-full rounded-full bg-[#F36509] text-base font-semibold text-white shadow-md shadow-orange-500/20 hover:bg-[#e05a00] disabled:opacity-70"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Signing in...
              </div>
            ) : (
              <span className="inline-flex items-center gap-2">
                Sign In
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
