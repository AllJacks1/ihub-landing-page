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
      <div className="flex w-full justify-center p-6">
        <div className="w-full max-w-7xl shrink-0">
          <ClientContainer view="agenda" />
        </div>
      </div>
    </CalendarProvider>
  );
}
