"use client";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, ArrowRight, Navigation } from "lucide-react";
import Link from "next/link";

export default function LocationSection() {
  return (
    <section
      id="location"
      className="bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden"
    >
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-4 border-stone-800 bg-stone-900/60 px-4 py-1.5 text-xs font-mono font-bold tracking-widest text-[#F36509] uppercase"
          >
            LOCATION & CONTACT
          </Badge>

          <h2 className="mb-5 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
            Come find us
          </h2>

          <div className="mb-2 inline-flex items-center justify-center gap-2 text-lg font-medium text-stone-200 sm:mb-3 sm:text-xl md:text-2xl">
            <MapPin className="h-6 w-6 shrink-0 text-[#F36509]" />
            <span className="text-left font-serif">
              Pines Place, Pioneer Drive, Bajada, Davao City
            </span>
          </div>

          <p className="mx-auto mb-10 max-w-lg text-sm text-stone-400 sm:mb-12 sm:text-base">
            Walking distance from Bluepost Boiling Crabs and Shrimps Resto
          </p>
        </motion.div>

        {/* Info Cards */}
        <div className="mb-10 grid gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-stone-800 bg-stone-900/50 text-left shadow-xl hover:border-stone-700">
              <CardContent className="flex items-start gap-4 p-5 sm:gap-5 sm:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F36509]/20 border border-[#F36509]/40 text-[#F36509]">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                    Operating Hours
                  </div>
                  <div className="text-3xl font-bold font-serif text-white sm:text-4xl">
                    24/7
                  </div>
                  <div className="mt-1 text-xs text-stone-400 font-sans">
                    Always open for work, study, and coffee
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-stone-800 bg-stone-900/50 text-left shadow-xl hover:border-stone-700">
              <CardContent className="flex items-start gap-4 p-5 sm:gap-5 sm:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                    Call or Message Us
                  </div>
                  <div className="space-y-1">
                    <a
                      href="tel:+639855713768"
                      className="block text-base font-semibold text-white transition-colors hover:text-[#F36509]"
                    >
                      +63 985 571 3768
                    </a>
                    <a
                      href="tel:+639056381598"
                      className="block text-base font-semibold text-white transition-colors hover:text-[#F36509]"
                    >
                      +63 905 638 1598
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4"
        >
          <Button
            size="lg"
            className="h-12 w-full max-w-xs rounded-full bg-[#F36509] px-6 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-[#e05a00] hover:scale-105 sm:h-14 sm:w-auto sm:px-8 sm:text-base cursor-pointer"
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
          />

          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full max-w-xs rounded-full border border-stone-700 bg-stone-900/60 px-6 text-sm font-semibold text-stone-200 transition-all hover:border-[#F36509] hover:text-[#F36509] sm:h-14 sm:w-auto sm:px-8 sm:text-base cursor-pointer"
            render={
              <Link
                href="https://www.facebook.com/ihubdvo"
                target="_blank"
                className="inline-flex items-center gap-2"
              >
                Follow on Facebook
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            }
          />
        </motion.div>
      </div>
    </section>
  );
}
