import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Navigation,
} from "lucide-react";
import { Facebook } from "@thesvg/react";

const contactMethods = [
  {
    icon: Phone,
    label: "Call Us",
    value: "0985 571 3768",
    href: "tel:09855713768",
    description: "Available 24/7 for inquiries",
  },
  {
    icon: Mail,
    label: "Email",
    value: "ihubdavao@gmail.com",
    href: "mailto:ihubdavao@gmail.com",
    description: "We'll respond within 24 hours",
  },
  {
    icon: MessageCircle,
    label: "Messenger",
    value: "Facebook Messenger",
    href: "https://m.me/ihubdavao",
    description: "I-Hub Davao - CoWorking Space and Bistro",
    external: true,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* ===== HERO ===== */}
      <section className="relative flex min-h-svh items-center justify-center overflow-hidden sm:min-h-140">
        <Image
          src="/images/contact_header.png"
          alt="iHub Contact"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-stone-900/70" />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge
            variant="outline"
            className="mb-5 border-white/30 px-3 py-1 text-xs font-bold tracking-widest text-white/70 sm:mb-6 sm:px-4 sm:py-1.5"
          >
            CONTACT
          </Badge>

          <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Get In Touch
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
            We&apos;d love to hear from you. Drop by, send us a message, or give
            us a call.
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* ===== MAIN CONTENT ===== */}
      <section className="px-4 py-14 sm:px-6 sm:py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          {/* Contact Information */}
          <div>
            <h2 className="mb-8 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:mb-10 sm:text-4xl md:text-5xl">
              Visit or Reach Us
            </h2>

            {/* Location */}
            <div className="mb-10 sm:mb-12">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-3">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <p className="text-lg leading-tight text-stone-800 sm:text-xl md:text-2xl">
                iHub at Pines Place,
                <br />
                Pioneer Drive, JP Laurel Avenue,
                <br />
                Bajada, Davao City,
                <br />
                Philippines 8000
              </p>
              <p className="mt-3 text-sm text-stone-500 sm:mt-4 sm:text-base">
                Walking distance from Bluepost Boiling Crabs and Shrimps Resto.
              </p>

              <Link
                href="https://maps.app.goo.gl/HSaoWPWhfgTQi3rAA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button
                  variant="outline"
                  className="mt-5 h-11 rounded-full border-2 border-stone-300 px-5 text-sm font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:border-[#F36509] hover:text-[#F36509] sm:mt-6 sm:h-12 sm:px-6"
                >
                  <Navigation className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
              </Link>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6 sm:space-y-8">
              {contactMethods.map((method) => (
                <div key={method.label}>
                  <div className="mb-1.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#F36509] sm:mb-2">
                    <method.icon className="h-4 w-4" />
                    {method.label}
                  </div>
                  <a
                    href={method.href}
                    target={method.external ? "_blank" : undefined}
                    rel={method.external ? "noopener noreferrer" : undefined}
                    className="group inline-flex items-center gap-2 text-lg font-semibold text-stone-900 transition-colors hover:text-[#F36509] sm:text-xl md:text-2xl"
                  >
                    {method.value}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5" />
                  </a>
                  <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                    {method.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map & Hours */}
          <div className="space-y-6 sm:space-y-8">
            {/* Map Card */}
            <Card className="overflow-hidden border-stone-200 pt-0 shadow-lg">
              <div className="relative aspect-video bg-stone-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3959.2338123109657!2d125.62671040000001!3d7.098876799999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32f96d91defcd011%3A0x388bdb3ec0260d4e!2si-Hub%20Davao%20-%20CoWorking%20Space%20and%20Bistro!5e0!3m2!1sen!2sph!4v1784250668776!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="iHub Location"
                  className="absolute inset-0"
                />
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <Badge className="bg-white/95 text-stone-900 backdrop-blur-sm hover:bg-white">
                    <Clock className="mr-1.5 h-3 w-3 text-[#F36509]" />
                    Open 24/7
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F36509]/10 sm:h-10 sm:w-10">
                    <MapPin className="h-4 w-4 text-[#F36509] sm:h-5 sm:w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Pines Place</p>
                    <p className="text-sm text-stone-500">Bajada, Davao City</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours Card */}
            <Card className="border-stone-200 bg-white shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/10 sm:mb-4 sm:h-14 sm:w-14">
                  <Clock className="h-6 w-6 text-[#F36509] sm:h-7 sm:w-7" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-stone-900 sm:mb-3 sm:text-2xl">
                  Business Hours
                </h3>
                <p className="text-2xl font-light leading-tight text-stone-800 sm:text-3xl md:text-4xl">
                  We are open{" "}
                  <span className="font-semibold text-[#F36509]">
                    24 hours a day, 7 days a week
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Social */}
            <Card className="border-stone-200 bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F36509]/10 sm:h-12 sm:w-12">
                    <Facebook className="h-5 w-5 text-[#F36509] sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">Follow Us</p>
                    <a
                      href="https://facebook.com/ihubdvo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-stone-500 transition-colors hover:text-[#F36509]"
                    >
                      I-Hub Davao - CoWorking Space and Bistro
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="pt-2 text-center sm:pt-4">
              <Button
                size="lg"
                className="h-12 w-full rounded-full bg-[#F36509] text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] sm:h-14 sm:text-base"
                render={
                  <Link
                    href="/booking"
                    className="inline-flex items-center justify-center gap-2"
                  >
                    Reserve Your Space
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                }
              ></Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL TAGLINE ===== */}
      <section className="bg-white px-4 py-12 text-center sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-xl italic tracking-tight text-stone-400 sm:text-2xl">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>
    </main>
  );
}
