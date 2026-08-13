import BookingPage from "@/components/sections/Bookings";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <BookingPage />
    </Suspense>
  );
}
