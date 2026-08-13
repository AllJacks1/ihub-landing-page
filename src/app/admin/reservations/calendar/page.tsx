import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import { getReservations } from "@/lib/actions";
import { reservationToEvent } from "@/calendar/mappers";
import { connection } from "next/server";

export default async function ReservationsCalendarPage() {
  await connection();

  const { data } = await getReservations();
  const events = (data || []).map(reservationToEvent);

  // The calendar expects a list of "users".
  // For reservations we can either:
  // 1. Use a single dummy user, or
  // 2. Create one "user" per unique guest
  const users = [{ id: "all", name: "All Guests", picturePath: null }];

  return (
    <CalendarProvider events={events} users={users}>
  <div className="flex w-full justify-center p-6">
    <div className="w-full max-w-7xl shrink-0">
      <ClientContainer view="month" />
    </div>
  </div>
</CalendarProvider>
  );
}
