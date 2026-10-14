import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationForm } from "@/components/sections/ReservationForm";

export default function NewReservationPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS / Terminal
            </p>

            <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
              New Reservation
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              Create a reservation for a guest (Admin)
            </p>
          </div>

          <Link href="/admin/pos/terminal/reservation">
            <Button
              type="button"
              variant="outline"
              className="border-stone-200"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Reservations
            </Button>
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <ReservationForm mode="admin" />
        </div>
      </div>
    </main>
  );
}