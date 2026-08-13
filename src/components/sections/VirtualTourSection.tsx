"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Play, Video } from "lucide-react";

export default function VirtualTourSection() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="bg-[#0a0a0a] px-4 py-20 sm:px-6 sm:py-24 md:py-28 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center sm:mb-16"
        >
          <Badge
            variant="outline"
            className="mb-3 border-stone-800 bg-stone-900/60 px-4 py-1.5 text-xs font-mono font-bold tracking-widest text-[#F36509] sm:mb-4 uppercase"
          >
            <Video className="w-3.5 h-3.5 mr-1.5 inline" /> SPACES & AMBIANCE
          </Badge>
          <h2 className="mb-3 font-serif text-3xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl">
            Take a look around
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-stone-400 sm:text-lg md:text-xl">
            From focused work zones to lively event nights — see where your next
            big idea happens.
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl shadow-orange-500/10 sm:rounded-3xl group"
        >
          <video
            className="aspect-video w-full object-cover"
            poster="images/iTourThumbnail.png"
            controls
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="videos/virtual-tour.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {!isPlaying && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs transition-all">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  const video =
                    e.currentTarget.parentElement?.parentElement?.querySelector(
                      "video",
                    );
                  if (video) {
                    video.play();
                    setIsPlaying(true);
                  }
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[#F36509] text-white shadow-2xl shadow-orange-500/40 cursor-pointer sm:h-24 sm:w-24 border-2 border-white/20"
                aria-label="Play virtual tour video"
              >
                <Play className="ml-1 h-9 w-9 sm:h-11 sm:w-11 fill-current" />
              </motion.button>
              <span className="mt-4 text-xs font-mono font-bold tracking-widest text-stone-300 uppercase">
                WATCH 24/7 VIRTUAL TOUR
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
