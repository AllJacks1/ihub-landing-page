"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Lock body scroll when menu is open
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
      {/* ===== NAV BAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
          {/* Logo */}
          <Link href="/" className="relative block h-12 w-28 shrink-0 sm:h-14 sm:w-32">
            <Image
              src="/logos/logo_black_horizontal.png"
              alt="i-Hub Davao - CoWorking Space and Bistro Logo"
              fill
              className="object-contain object-left"
              priority
              sizes="(max-width: 640px) 112px, 128px"
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-6 text-sm font-medium lg:flex xl:gap-8">
            {navLinks.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap transition-colors hover:text-[#F36509]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="whitespace-nowrap transition-colors hover:text-[#F36509]"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/booking?type=bistro"
              className="whitespace-nowrap rounded-full border-2 border-[#F36509] px-5 py-2.5 text-sm font-semibold text-[#F36509] transition-all hover:bg-[#F36509] hover:text-white active:scale-95"
            >
              Table Reservation
            </Link>
            <Link
              href="/booking?type=conference"
              className="whitespace-nowrap rounded-full bg-[#F36509] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#d94f00] active:scale-95"
            >
              Conference Room
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[#1C1C1D] lg:hidden"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </nav>

      {/* ===== MOBILE MENU (OUTSIDE the nav to avoid backdrop-blur stacking issues) ===== */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu panel */}
          <div className="absolute inset-x-0 top-16 bottom-0 overflow-y-auto bg-white sm:top-20">
            <div className="flex flex-col px-6 py-8">
              {navLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="border-b border-gray-100 py-3.5 text-lg font-medium transition-colors hover:text-[#F36509] last:border-0"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="border-b border-gray-100 py-3.5 text-lg font-medium transition-colors hover:text-[#F36509] last:border-0"
                  >
                    {link.label}
                  </Link>
                ),
              )}

              {/* Mobile CTAs */}
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href="/booking?type=bistro"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border-2 border-[#F36509] py-3.5 text-center font-semibold text-[#F36509] transition-all hover:bg-[#F36509] hover:text-white active:scale-[0.98]"
                >
                  Table Reservation
                </Link>
                <Link
                  href="/booking?type=conference"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full bg-[#F36509] py-3.5 text-center font-semibold text-white transition-all hover:bg-[#d94f00] active:scale-[0.98]"
                >
                  Conference Room
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-16 sm:h-20" />
    </>
  );
}