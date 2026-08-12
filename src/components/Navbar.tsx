"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    {
      href: "https://online.fliphtml5.com/mtvla/uhye/",
      label: "Menu",
      external: true,
    },
    { href: "/bistro", label: "Bistro" },
    { href: "/events", label: "Events" },
    { href: "/coworking", label: "Coworking Space" },
    { href: "/about", label: "About Us" },
    { href: "/blogs", label: "Blogs" },
    { href: "/faqs", label: "FAQs" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <div className="relative w-28 sm:w-32 h-12 sm:h-14">
                <Image
                  src="/logos/logo_black_horizontal.png"
                  alt="i-Hub Davao - CoWorking Space and Bistro Logo"
                  fill
                  className="object-contain object-left"
                  priority
                  sizes="(max-width: 640px) 112px, 128px"
                />
              </div>
            </Link>

            {/* Desktop Navigation - appears from lg (1024px) */}
            <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link hover:text-[#F36509] transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="nav-link hover:text-[#F36509] transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/booking?type=bistro"
                className="px-5 py-2.5 text-sm font-semibold border-2 border-[#F36509] text-[#F36509] rounded-full hover:bg-[#F36509] hover:text-white transition-all active:scale-95 whitespace-nowrap"
              >
                Table Reservation
              </Link>
              <Link
                href="/booking?type=conference"
                className="px-5 py-2.5 text-sm font-semibold bg-[#F36509] text-white rounded-full hover:bg-[#d94f00] transition-all active:scale-95 whitespace-nowrap"
              >
                Conference Room
              </Link>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2.5 -mr-2 text-[#1C1C1D] min-w-11 min-h-11 flex items-center justify-center"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="lg:hidden fixed inset-0 top-16 sm:top-20 z-40 bg-white overflow-y-auto">
            <div className="px-6 py-8 flex flex-col gap-1">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="block py-3.5 text-lg font-medium hover:text-[#F36509] transition-colors border-b border-gray-100 last:border-0"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block py-3.5 text-lg font-medium hover:text-[#F36509] transition-colors border-b border-gray-100 last:border-0"
                  >
                    {link.label}
                  </Link>
                ),
              )}

              {/* Mobile CTAs */}
              <div className="pt-8 flex flex-col gap-3">
                <Link
                  href="/booking?type=bistro"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-3.5 border-2 border-[#F36509] text-[#F36509] rounded-full font-semibold hover:bg-[#F36509] hover:text-white transition-all active:scale-[0.98]"
                >
                  Table Reservation
                </Link>
                <Link
                  href="/booking?type=conference"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-3.5 bg-[#F36509] text-white rounded-full font-semibold hover:bg-[#d94f00] transition-all active:scale-[0.98]"
                >
                  Conference Room
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer so content isn't hidden under fixed nav */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
