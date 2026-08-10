import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";

import { AgendaEventCard } from "@/calendar/components/agenda-view/agenda-event-card";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  date: Date;
  events: IEvent[];
  multiDayEvents: IEvent[];
}

export function AgendaDayGroup({ date, events, multiDayEvents }: IProps) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex items-center gap-4 bg-background py-2">
        <p className="text-sm font-semibold">
          {format(date, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="space-y-2">
        {multiDayEvents.map((event) => {
          const eventStart = startOfDay(parseISO(event.startDate));
          const eventEnd = startOfDay(parseISO(event.endDate));
          const currentDate = startOfDay(date);

          const eventTotalDays =
            differenceInCalendarDays(eventEnd, eventStart) + 1;
          const eventCurrentDay =
            differenceInCalendarDays(currentDate, eventStart) + 1;

          return (
            <AgendaEventCard
              key={`${event.id}-${format(date, "yyyy-MM-dd")}`}
              event={event}
              eventCurrentDay={eventCurrentDay}
              eventTotalDays={eventTotalDays}
            />
          );
        })}

        {sortedEvents.map((event) => (
          <AgendaEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
