import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, ArrowRight, Navigation } from "lucide-react";
import { Facebook } from "@thesvg/react";

export default function LocationSection() {
  return (
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Badge
          variant="outline"
          className="mb-4 border-stone-300 px-3 py-1 text-xs font-bold tracking-widest text-stone-500 sm:mb-6 sm:px-4 sm:py-1.5"
        >
          GET IN TOUCH
        </Badge>

        <h2 className="mb-5 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
          Come find us
        </h2>

        <div className="mb-2 inline-flex items-center justify-center gap-2 text-lg font-medium text-stone-800 sm:mb-3 sm:text-xl md:text-2xl">
          <MapPin className="h-5 w-5 shrink-0 text-[#F36509] sm:h-6 sm:w-6" />
          <span className="text-left">
            Pines Place, Pioneer Drive, Bajada, Davao City
          </span>
        </div>

        <p className="mx-auto mb-10 max-w-lg text-sm text-stone-400 sm:mb-12 sm:text-base md:text-lg">
          Walking distance from Bluepost Boiling Crabs and Shrimps Resto
        </p>

        {/* Info Cards */}
        <div className="mb-10 grid gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6">
          <Card className="border-stone-200 bg-white text-left shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-4 p-5 sm:gap-5 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Clock className="h-6 w-6 text-[#F36509] sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 sm:text-xs">
                  We are open
                </div>
                <div className="text-3xl font-semibold text-stone-900 sm:text-4xl">
                  24/7
                </div>
                <div className="mt-1 text-xs text-stone-500 sm:text-sm">
                  Always here when you need us
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-white text-left shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-start gap-4 p-5 sm:gap-5 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 sm:h-14 sm:w-14 sm:rounded-2xl">
                <Phone className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
              </div>
              <div>
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 sm:text-xs">
                  Call or Message
                </div>
                <div className="space-y-1">
                  <a
                    href="tel:+639855713768"
                    className="block text-base font-medium text-stone-800 transition-colors hover:text-[#F36509] sm:text-lg"
                  >
                    +63 985 571 3768
                  </a>
                  <a
                    href="tel:+639056381598"
                    className="block text-base font-medium text-stone-800 transition-colors hover:text-[#F36509] sm:text-lg"
                  >
                    +63 905 638 1598
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Button
            size="lg"
            className="h-12 w-full max-w-xs rounded-full bg-[#F36509] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#e05a00] hover:shadow-xl hover:shadow-orange-500/30 sm:h-14 sm:w-auto sm:px-8 sm:text-base"
            render={
              <Link
                href="https://maps.app.goo.gl/nkWELKzF2f9Bk4P79"
                target="_blank"
                className="inline-flex items-center gap-2"
              >
                <Navigation className="h-4 w-4 sm:h-5 sm:w-5" />
                Get Directions
              </Link>
            }
          ></Button>

          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full max-w-xs rounded-full border-2 border-stone-300 px-6 text-sm font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:border-[#F36509] hover:text-[#F36509] sm:h-14 sm:w-auto sm:px-8 sm:text-base"
            render={
              <Link
                href="https://www.facebook.com/ihubdvo"
                target="_blank"
                className="inline-flex items-center gap-2"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                Follow on Facebook
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            }
          ></Button>
        </div>
      </div>
    </section>
  );
}
