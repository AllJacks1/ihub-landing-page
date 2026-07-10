"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-8xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="relative w-26 h-16 transition-transform group-hover:scale-110">
                <Image
                  src="/logos/logo_black_horizontal.png"
                  alt="i-Hub Davao - CoWorking Space and Bistro Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex items-center gap-10 text-sm font-medium">
              <Link
                href="/"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/menu"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Menu
              </Link>
              <Link
                href="/bistro"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Bistro
              </Link>
              <Link
                href="/events"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Events
              </Link>
              <Link
                href="/coworking"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Coworking Space
              </Link>
              <Link
                href="/about"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                About Us
              </Link>
              <Link
                href="/blogs"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Blogs
              </Link>
              <Link
                href="/faqs"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                FAQs
              </Link>
              <Link
                href="/contact"
                className="nav-link hover:text-[#F36509] transition-colors"
              >
                Contact
              </Link>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/reserve/table"
                className="px-6 py-2.5 text-sm font-semibold border-2 border-[#F36509] text-[#F36509] rounded-full hover:bg-[#F36509] hover:text-white transition-all active:scale-95"
              >
                Table Reservation
              </Link>
              <Link
                href="/reserve/conference"
                className="px-6 py-2.5 text-sm font-semibold bg-[#F36509] text-white rounded-full hover:bg-[#d94f00] transition-all active:scale-95"
              >
                Conference Room
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-[#1C1C1D]"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-6 py-8 flex flex-col gap-6 text-lg font-medium">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Home
              </Link>
              <Link
                href="/menu"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Menu
              </Link>
              <Link
                href="/bistro"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Bistro
              </Link>
              <Link
                href="/events"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Events
              </Link>
              <Link
                href="/coworking"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Coworking Space
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                About Us
              </Link><Link
                href="/blogs"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Blogs               
              </Link>
              <Link
                href="/faqs"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                FAQs
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="hover:text-[#F36509]"
              >
                Contact
              </Link>

              <div className="pt-6 border-t flex flex-col gap-4">
                <Link
                  href="/reserve/table"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-4 border-2 border-[#F36509] text-[#F36509] rounded-full font-semibold hover:bg-[#F36509] hover:text-white"
                >
                  Table Reservation
                </Link>
                <Link
                  href="/reserve/conference"
                  onClick={() => setIsOpen(false)}
                  className="text-center py-4 bg-[#F36509] text-white rounded-full font-semibold hover:bg-[#d94f00]"
                >
                  Conference Room
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}
