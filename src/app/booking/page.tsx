import BookingPage from "@/components/sections/Bookings";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Reserve Your Space | iHub",
  description:
    "Book a coworking desk, conference room, or bistro table at iHub. Choose from iStudy packages, meeting rooms, and café seating. Open 24/7.",
  keywords: [
    "iHub booking",
    "coworking space",
    "conference room rental",
    "bistro reservation",
    "study space",
    "meeting room",
    "iStudy",
    "iWork",
  ],
  openGraph: {
    title: "Reserve Your Space | iHub",
    description:
      "Book a coworking desk, conference room, or bistro table at iHub. Open 24/7.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reserve Your Space | iHub",
    description:
      "Book a coworking desk, conference room, or bistro table at iHub.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <BookingPage />
    </Suspense>
  );
}
