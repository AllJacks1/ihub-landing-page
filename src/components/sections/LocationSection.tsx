import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, ArrowRight, Navigation } from "lucide-react";
import { Facebook } from "@thesvg/react";

export default function LocationSection() {
  return (
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        {/* Header */}
        <Badge
          variant="outline"
          className="mb-6 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
        >
          GET IN TOUCH
        </Badge>

        <h2 className="mb-6 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
          Come find us
        </h2>

        <div className="mb-3 inline-flex items-center gap-2 text-2xl font-medium text-stone-800">
          <MapPin className="h-6 w-6 text-[#F36509]" />
          Pines Place, Pioneer Drive, Bajada, Davao City
        </div>

        <p className="mx-auto mb-12 max-w-lg text-lg text-stone-400">
          Walking distance from Bluepost Boiling Crabs and Shrimps Resto
        </p>

        {/* Info Cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          {/* Hours */}
          <Card className="border-stone-200 bg-white text-left shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-5 p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F36509]/10">
                <Clock className="h-7 w-7 text-[#F36509]" />
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                  We are open
                </div>
                <div className="text-4xl font-semibold text-stone-900">
                  24/7
                </div>
                <div className="mt-1 text-sm text-stone-500">
                  Always here when you need us
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-stone-200 bg-white text-left shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-5 p-8">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                <Phone className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <div className="mb-1 text-xs font-bold uppercase tracking-widest text-stone-400">
                  Call or Message
                </div>
                <div className="space-y-1">
                  <a
                    href="tel:+639855713768"
                    className="block text-lg font-medium text-stone-800 transition-colors hover:text-[#F36509]"
                  >
                    +63 985 571 3768
                  </a>
                  <a
                    href="tel:+639056381598"
                    className="block text-lg font-medium text-stone-800 transition-colors hover:text-[#F36509]"
                  >
                    +63 905 638 1598
                  </a>
                </div>
              </div>
            </CardContent>
          </Card> 
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="h-14 rounded-full bg-[#F36509] px-8 text-base font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30"
          >
            <Link
              href="https://maps.app.goo.gl/nkWELKzF2f9Bk4P79"
              target="_blank"
              className="inline-flex items-center gap-2"
            >
              <Navigation className="h-5 w-5" />
              Get Directions
            </Link>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="h-14 rounded-full border-2 border-stone-300 px-8 text-base font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:border-[#F36509] hover:text-[#F36509]"
          >
            <Link
              href="https://www.facebook.com/ihubdvo"
              target="_blank"
              className="inline-flex items-center gap-2"
            >
              <Facebook className="h-5 w-5" />
              Follow on Facebook
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
