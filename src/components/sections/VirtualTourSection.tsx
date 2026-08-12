"use client";

import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { useState } from "react";

export default function VirtualTourSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="bg-stone-50 px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <Badge
            variant="outline"
            className="mb-3 border-stone-300 px-3 py-1 text-xs font-bold tracking-widest text-stone-500 sm:mb-4 sm:px-4 sm:py-1.5"
          >
            SPACES
          </Badge>
          <h2 className="mb-3 font-serif text-3xl font-semibold tracking-tighter text-stone-900 sm:text-4xl md:text-5xl lg:text-6xl">
            Take a look around
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-stone-500 sm:text-lg md:text-xl">
            From focused work zones to lively event nights — see where your next
            big idea happens.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-stone-200 bg-black shadow-2xl sm:rounded-3xl">
          <video
            className="aspect-video w-full"
            poster="/images/iTourThumbnail.png"
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/videos/virtual-tour.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <button
                onClick={(e) => {
                  const video =
                    e.currentTarget.parentElement?.parentElement?.querySelector(
                      "video",
                    );
                  video?.play();
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-stone-900 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white sm:h-20 sm:w-20"
                aria-label="Play virtual tour"
              >
                <Play className="ml-1 h-8 w-8 sm:h-10 sm:w-10" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
