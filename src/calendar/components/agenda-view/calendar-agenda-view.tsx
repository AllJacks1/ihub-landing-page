"use client";

import { useMemo, useState } from "react";
import { CalendarX2, Search, X } from "lucide-react";
import {
  parseISO,
  format,
  endOfDay,
  startOfDay,
  isSameMonth,
  eachDayOfInterval,
} from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgendaDayGroup } from "@/calendar/components/agenda-view/agenda-day-group";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

function matchesQuery(event: IEvent, query: string): boolean {
  if (!query) return true;

  const q = query.toLowerCase().trim();
  const haystack = [
    event.title,
    event.description?.replace(/<[^>]*>/g, " ") ?? "",
    event.user?.name ?? "",
    // reservation extras when present
    (
      event as IEvent & {
        reservation?: {
          full_name?: string;
          email?: string;
          zone?: string;
          status?: string;
        };
      }
    ).reservation?.full_name,
    (event as IEvent & { reservation?: { email?: string } }).reservation?.email,
    (event as IEvent & { reservation?: { zone?: string } }).reservation?.zone,
    (event as IEvent & { reservation?: { status?: string } }).reservation
      ?.status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function CalendarAgendaView({
  singleDayEvents,
  multiDayEvents,
}: IProps) {
  const { selectedDate } = useCalendar();
  const [query, setQuery] = useState("");

  const filteredSingle = useMemo(
    () => singleDayEvents.filter((e) => matchesQuery(e, query)),
    [singleDayEvents, query],
  );

  const filteredMulti = useMemo(
    () => multiDayEvents.filter((e) => matchesQuery(e, query)),
    [multiDayEvents, query],
  );

  const eventsByDay = useMemo(() => {
    const allDates = new Map<
      string,
      { date: Date; events: IEvent[]; multiDayEvents: IEvent[] }
    >();

    filteredSingle.forEach((event) => {
      const eventDate = parseISO(event.startDate);
      if (!isSameMonth(eventDate, selectedDate)) return;

      const dateKey = format(eventDate, "yyyy-MM-dd");

      if (!allDates.has(dateKey)) {
        allDates.set(dateKey, {
          date: startOfDay(eventDate),
          events: [],
          multiDayEvents: [],
        });
      }

      allDates.get(dateKey)!.events.push(event);
    });

    filteredMulti.forEach((event) => {
      const eventStart = startOfDay(parseISO(event.startDate));
      const eventEnd = startOfDay(parseISO(event.endDate));

      // Safe day iteration (no mutating setDate)
      const days = eachDayOfInterval({ start: eventStart, end: eventEnd });

      days.forEach((day) => {
        if (!isSameMonth(day, selectedDate)) return;

        const dateKey = format(day, "yyyy-MM-dd");

        if (!allDates.has(dateKey)) {
          allDates.set(dateKey, {
            date: startOfDay(day),
            events: [],
            multiDayEvents: [],
          });
        }

        allDates.get(dateKey)!.multiDayEvents.push(event);
      });
    });

    return Array.from(allDates.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [filteredSingle, filteredMulti, selectedDate]);

  const hasAnyEvents = filteredSingle.length > 0 || filteredMulti.length > 0;
  const hasSourceEvents =
    singleDayEvents.length > 0 || multiDayEvents.length > 0;

  return (
    <div className="flex h-[800px] flex-col overflow-hidden">
      {/* Search — fixed height, don't shrink */}
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, notes, zone, status…"
            className="h-9 pr-9 pl-9"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* min-h-0 is required for flex + overflow scroll */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          {eventsByDay.map((dayGroup) => (
            <AgendaDayGroup
              key={format(dayGroup.date, "yyyy-MM-dd")}
              date={dayGroup.date}
              events={dayGroup.events}
              multiDayEvents={dayGroup.multiDayEvents}
            />
          ))}

          {!hasAnyEvents && (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <CalendarX2 className="size-10" />
              <p className="text-sm md:text-base">
                {query && hasSourceEvents
                  ? `No reservations match “${query}”`
                  : "No events scheduled for the selected month"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
