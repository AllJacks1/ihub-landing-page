"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { signInUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setShowPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInUser({ email, secret: password });

      if (!result.success) {
        toast.error(result.error || "Login failed");
        return;
      }

      toast.success("Welcome back!");
      resetFields();
      router.push("/iaccess/member");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Background Image */}
      <Image
        src="/images/hero.png"
        alt="iHub Coworking Bistro Davao"
        fill
        className="object-cover opacity-30 scale-105"
        priority
        sizes="100vw"
      />

      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] h-125 w-125 rounded-full bg-[#F36509]/20 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-5%] left-[-5%] h-112.5 w-112.5 rounded-full bg-stone-800/40 blur-[120px]" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-[#0a0a0a]" />

      {/* Back to home */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-stone-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-stone-800/80 bg-stone-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Logo / Badge */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl"
            >
              <Image
                src="/images/iaccess_logo.png"
                alt="iAccess"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-serif text-2xl tracking-tight text-white sm:text-3xl"
            >
              Welcome back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-2 text-sm text-stone-400"
            >
              Sign in to access points, rewards & more
            </motion.p>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium uppercase tracking-wider text-stone-500"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-stone-900/80 py-3 pr-4 pl-11 text-sm text-white placeholder:text-stone-600 outline-none transition-all focus:border-[#F36509] focus:ring-2 focus:ring-[#F36509]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wider text-stone-500"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-700 bg-stone-900/80 py-3 pr-12 pl-11 text-sm text-white placeholder:text-stone-600 outline-none transition-all focus:border-[#F36509] focus:ring-2 focus:ring-[#F36509]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3.5 -translate-y-1/2 text-stone-500 transition-colors hover:text-stone-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            {/* <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-stone-400 transition-colors hover:text-[#F36509]"
              >
                Forgot password?
              </Link>
            </div> */}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[#F36509] text-base font-semibold text-white shadow-xl shadow-orange-500/25 transition-all hover:bg-[#e05a00] hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </motion.form>

          {/* Footer note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-center text-xs text-stone-500"
          >
            Need an{" "}
            <Link
              href="/passes"
              className="font-medium text-stone-300 underline decoration-stone-600 underline-offset-4 transition-colors hover:text-[#F36509] hover:decoration-[#F36509]"
            >
              iAccess account
            </Link>
            ?
          </motion.p>
        </motion.div>

        {/* Bottom brand line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 text-center text-[10px] uppercase tracking-widest text-stone-600"
        >
          iHub · iAccess Davao
        </motion.p>
      </div>
    </div>
  );
}
