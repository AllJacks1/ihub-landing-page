"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";

export default function VirtualTourSection() {
  const [isPlaying, setIsPlaying] = useState(false);

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

        {/* Video Container */}
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-stone-200 bg-black shadow-2xl">
          <video
            className="w-full aspect-video"
            poster="/images/iTourThumbnail.png"
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/videos/virtual-tour.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Play Overlay (shown before play) */}
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
                className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-stone-900 backdrop-blur-sm transition-all hover:scale-110 hover:bg-white"
              >
                <Play className="h-10 w-10 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
