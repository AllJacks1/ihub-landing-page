import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Phone, Mail } from "lucide-react";
import { Facebook, Instagram } from "@thesvg/react";
import Image from "next/image";

const quickLinks = [
  { label: "Coworking", href: "/coworking" },
  { label: "Bistro", href: "/bistro" },
  { label: "Reserve", href: "/reserve" },
  { label: "Events", href: "/events" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/ihubdavao", label: "Facebook" },
  {
    icon: Instagram,
    href: "https://instagram.com/ihubdavao",
    label: "Instagram",
  },
  { icon: Mail, href: "mailto:hello@ihubdavao.com", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-stone-900 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div className="text-center md:text-left">
            <div className="mb-4 flex items-center justify-center md:justify-start">
              <Image
                src="/logos/logo_white_horizontal.png"
                alt="iHub Davao"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="mb-4 text-sm leading-relaxed text-stone-400">
              Davao&apos;s first 24/7 coworking bistro hub. Where work meets
              good food, great coffee, and even better company.
            </p>
            <div className="flex items-center justify-center gap-3 md:justify-start">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-stone-400 transition-colors hover:bg-[#F36509] hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-stone-500">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-stone-400 transition-colors hover:text-[#F36509]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-left">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-stone-500">
              Find Us
            </h3>
            <div className="space-y-4">
              <div className="flex items-start justify-center gap-3 md:justify-start">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F36509]" />
                <span className="text-sm text-stone-400">
                  Pines Place, Pioneer Drive
                  <br />
                  Bajada, Davao City
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Clock className="h-4 w-4 shrink-0 text-[#F36509]" />
                <span className="text-sm text-stone-400">
                  Open 24 hours, 7 days a week
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Phone className="h-4 w-4 shrink-0 text-[#F36509]" />
                <a
                  href="tel:+639855713768"
                  className="text-sm text-stone-400 transition-colors hover:text-[#F36509]"
                >
                  +63 985 571 3768
                </a>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-10 bg-stone-800" />

        {/* Bottom */}
        <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-stone-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} iHub Coworking Bistro. All rights
            reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="transition-colors hover:text-stone-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-stone-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
