"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";

const photos = [
  {
    src: "/images/gallery/coworking-main.jpg",
    alt: "Open coworking space with natural light",
    category: "Coworking",
  },
  {
    src: "/images/gallery/bistro-counter.jpg",
    alt: "Artisan coffee bar and bistro counter",
    category: "Bistro",
  },
  {
    src: "/images/gallery/meeting-room.jpg",
    alt: "Conference room with modern setup",
    category: "Conference",
  },
  {
    src: "/images/gallery/event-night.jpg",
    alt: "Live acoustic music night",
    category: "Events",
  },
  {
    src: "/images/gallery/study-zone.jpg",
    alt: "Quiet study zone with ergonomic seating",
    category: "iStudy",
  },
  {
    src: "/images/gallery/exterior.jpg",
    alt: "iHub building exterior at night",
    category: "Exterior",
  },
  {
    src: "/images/gallery/coffee-detail.jpg",
    alt: "Latte art and fresh pastries",
    category: "Bistro",
  },
  {
    src: "/images/gallery/lounge-area.jpg",
    alt: "iLounge collaborative space",
    category: "iLounge",
  },
];

export default function GallerySection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <section className="bg-stone-50 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
          >
            SPACES
          </Badge>
          <h2 className="mb-4 font-serif text-5xl font-semibold tracking-tighter text-stone-900 md:text-6xl">
            Take a look around
          </h2>
          <p className="mx-auto max-w-xl text-xl leading-relaxed text-stone-500">
            From focused work zones to lively event nights — see where your next
            big idea happens.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className={`group relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-200 text-left transition-all hover:shadow-xl ${
                i === 0 || i === 5 ? "sm:col-span-2 lg:col-span-1" : ""
              } ${i === 3 ? "sm:row-span-2" : ""}`}
            >
              <div
                className={`relative w-full bg-stone-300 ${
                  i === 3
                    ? "aspect-[3/4] sm:aspect-auto sm:h-full"
                    : "aspect-[4/3]"
                }`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Category badge */}
                <div className="absolute left-4 top-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <Badge className="bg-white/95 text-stone-900 backdrop-blur-sm hover:bg-white">
                    <Camera className="mr-1.5 h-3 w-3" />
                    {photo.category}
                  </Badge>
                </div>

                {/* Alt text on hover */}
                <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-sm font-medium text-white">{photo.alt}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            className="h-14 rounded-full border-2 border-stone-300 px-8 text-base font-semibold text-stone-700 transition-all hover:-translate-y-0.5 hover:border-[#F36509] hover:text-[#F36509]"
          >
            <a href="/spaces" className="inline-flex items-center gap-2">
              See all spaces
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-0 bg-stone-900/95 p-0 backdrop-blur-xl">
          <DialogTitle className="sr-only">
            {photos[currentIndex]?.alt}
          </DialogTitle>

          <div className="relative flex h-[80vh] items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image */}
            <div className="relative h-full w-full">
              <Image
                src={photos[currentIndex]?.src}
                alt={photos[currentIndex]?.alt}
                fill
                className="object-contain p-4"
                sizes="100vw"
                priority
              />
            </div>

            {/* Navigation */}
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
