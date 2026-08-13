"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const openBooking = (type: string = "bistro") => {
    window.dispatchEvent(
      new CustomEvent("open-booking-modal", { detail: { type } }),
    );
    setMobileMenuOpen(false);
  };

  const openMenu = () => {
    window.dispatchEvent(new CustomEvent("open-menu-modal"));
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { href: "#", label: "Home" },
    {
      href: "/bistro",
      label: "24/7 Menu",
      isModal: true,
    },
    { href: "#spaces", label: "Coworking" },
    { href: "#events", label: "Events & Music" },
    { href: "#passes", label: "Passes & Rates" },
    { href: "#location", label: "Contact & Location" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-stone-950/90 backdrop-blur-xl border-b border-stone-800/80 py-3 shadow-2xl"
          : "bg-gradient-to-b from-stone-950/90 via-stone-950/50 to-transparent py-4"
      }`}
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="relative block shrink-0 group">
          <Image
            src="/logos/logo_white_horizontal.png"
            alt="i-Hub Davao - CoWorking Space and Bistro Logo"
            className={`$object-contain object-left transition-transform duration-300 group-hover:scale-105`}
            width={120}
            height={20}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 ml-46">
          {navLinks.map((link) =>
            link.isModal ? (
              <button
                key={link.label}
                onClick={openMenu}
                className="text-xs font-semibold tracking-widest text-stone-300 hover:text-[#F36509] transition-colors uppercase cursor-pointer"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs font-semibold tracking-widest text-stone-300 hover:text-[#F36509] transition-colors uppercase"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {/* <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            24/7 OPEN
          </div> */}

          <button
            onClick={() => openBooking("bistro")}
            className="px-5 py-2.5 border-2 border-[#F36509] text-[#F36509] hover:bg-[#F36509] hover:text-white text-xs font-bold rounded-full transition-all cursor-pointer active:scale-95"
          >
            Table Reservation
          </button>

          <button
            onClick={() => openBooking("conference")}
            className="px-5 py-2.5 bg-[#F36509] text-white text-xs font-bold rounded-full hover:bg-[#e05a00] hover:shadow-lg hover:shadow-orange-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" /> Conference Room
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-stone-300 hover:text-white focus:outline-none cursor-pointer"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-stone-950/98 backdrop-blur-2xl border-b border-stone-800 px-6 py-6 space-y-4"
          >
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) =>
                link.isModal ? (
                  <button
                    key={link.label}
                    onClick={openMenu}
                    className="text-left text-sm font-semibold tracking-widest text-stone-300 hover:text-[#F36509] py-1 uppercase"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-semibold tracking-widest text-stone-300 hover:text-[#F36509] py-1 uppercase"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>

            {/* Mobile CTAs */}
            <div className="pt-4 border-t border-stone-800 flex flex-col gap-2.5">
              <button
                onClick={() => openBooking("bistro")}
                className="w-full py-3 border-2 border-[#F36509] text-[#F36509] hover:bg-[#F36509] hover:text-white text-sm font-bold rounded-full text-center transition-colors"
              >
                Table Reservation
              </button>
              <button
                onClick={() => openBooking("conference")}
                className="w-full py-3 bg-[#F36509] text-white text-sm font-bold rounded-full text-center hover:bg-[#e05a00] transition-colors"
              >
                Conference Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
