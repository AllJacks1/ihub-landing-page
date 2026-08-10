"use client";

import { useMemo } from "react";
import {
  isSameDay,
  parseISO,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
} from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { DndProviderWrapper } from "@/calendar/components/dnd/dnd-provider";

import { CalendarHeader } from "@/calendar/components/header/calendar-header";
import { CalendarYearView } from "@/calendar/components/year-view/calendar-year-view";
import { CalendarMonthView } from "@/calendar/components/month-view/calendar-month-view";
import { CalendarAgendaView } from "@/calendar/components/agenda-view/calendar-agenda-view";
import { CalendarDayView } from "@/calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/calendar/components/week-and-day-view/calendar-week-view";

import type { TCalendarView } from "@/calendar/types";
import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  view: TCalendarView;
}

function getViewRange(view: TCalendarView, selectedDate: Date) {
  switch (view) {
    case "year":
      return {
        start: startOfYear(selectedDate),
        end: endOfYear(selectedDate),
      };
    case "month":
    case "agenda":
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate),
      };
    case "week":
      return {
        start: startOfWeek(selectedDate),
        end: endOfWeek(selectedDate),
      };
    case "day":
      return {
        start: startOfDay(selectedDate),
        end: endOfDay(selectedDate),
      };
  }
}

function isInRange(event: IEvent, rangeStart: Date, rangeEnd: Date) {
  const eventStart = parseISO(event.startDate);
  const eventEnd = parseISO(event.endDate);
  return eventStart <= rangeEnd && eventEnd >= rangeStart;
}

function matchesZone(event: IEvent, selectedZone: string) {
  if (selectedZone === "all") return true;
  return event.reservation?.zone === selectedZone;
}

export function ClientContainer({ view }: IProps) {
  const { selectedDate, selectedUserId: selectedZone, events } = useCalendar();

  const filteredEvents = useMemo(() => {
    const { start, end } = getViewRange(view, selectedDate);

    return events.filter(
      (event) =>
        isInRange(event, start, end) && matchesZone(event, selectedZone),
    );
  }, [selectedDate, selectedZone, events, view]);

  const singleDayEvents = useMemo(
    () =>
      filteredEvents.filter((event) =>
        isSameDay(parseISO(event.startDate), parseISO(event.endDate)),
      ),
    [filteredEvents],
  );

  const multiDayEvents = useMemo(
    () =>
      filteredEvents.filter(
        (event) =>
          !isSameDay(parseISO(event.startDate), parseISO(event.endDate)),
      ),
    [filteredEvents],
  );

  // Year view only needs start-day dots
  const eventStartDates = useMemo(
    () =>
      filteredEvents.map((event) => ({
        ...event,
        endDate: event.startDate,
      })),
    [filteredEvents],
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <CalendarHeader view={view} events={filteredEvents} />

      <DndProviderWrapper>
        {view === "day" && (
          <CalendarDayView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "month" && (
          <CalendarMonthView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "week" && (
          <CalendarWeekView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
        {view === "year" && <CalendarYearView allEvents={eventStartDates} />}
        {view === "agenda" && (
          <CalendarAgendaView
            singleDayEvents={singleDayEvents}
            multiDayEvents={multiDayEvents}
          />
        )}
      </DndProviderWrapper>
    </div>
  );
}
