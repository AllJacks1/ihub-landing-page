import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import { getReservations } from "@/lib/actions";
import { reservationToEvent } from "@/calendar/mappers";
import { connection } from "next/server";

export default async function ReservationsCalendarPage() {
  await connection();
  
  const { data } = await getReservations();
  const events = (data || []).map(reservationToEvent);

  const users = [{ id: "all", name: "All Guests", picturePath: null }];

  return (
    <CalendarProvider events={events} users={users}>
      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
        {/* Header */}
        <div className="border-b border-stone-200 bg-white px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
                Reservations
              </p>

              <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
                Weekly Reservations
              </h1>

              <p className="mt-1 text-sm text-stone-500">
                Overview of all reservations across the week.
              </p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full">
            <ClientContainer view="week" />
          </div>
        </div>
      </main>
    </CalendarProvider>
  );
}
