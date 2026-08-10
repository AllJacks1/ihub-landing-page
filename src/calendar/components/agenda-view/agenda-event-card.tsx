"use client";

import { format, parseISO } from "date-fns";
import { cva, type VariantProps } from "class-variance-authority";
import { Clock, Text, User } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { EventDetailsDialog } from "@/calendar/components/dialogs/event-details-dialog";

import type { IEvent } from "@/calendar/interfaces";

const agendaEventCardVariants = cva(
  "flex select-none items-center justify-between gap-3 rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: {
        blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 [&_.event-dot]:fill-blue-600",
        green:
          "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300 [&_.event-dot]:fill-green-600",
        red: "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600",
        yellow:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 [&_.event-dot]:fill-yellow-600",
        purple:
          "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 [&_.event-dot]:fill-purple-600",
        orange:
          "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 [&_.event-dot]:fill-orange-600",
        gray: "border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 [&_.event-dot]:fill-neutral-600",

        "blue-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-blue-600",
        "green-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-green-600",
        "red-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-red-600",
        "orange-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-orange-600",
        "purple-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-purple-600",
        "yellow-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-yellow-600",
        "gray-dot":
          "bg-neutral-50 dark:bg-neutral-900 [&_.event-dot]:fill-neutral-600",
      },
    },
    defaultVariants: {
      color: "blue-dot",
    },
  },
);

interface IProps {
  event: IEvent;
  eventCurrentDay?: number;
  eventTotalDays?: number;
}

export function AgendaEventCard({
  event,
  eventCurrentDay,
  eventTotalDays,
}: IProps) {
  const { badgeVariant } = useCalendar();

  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const color = (
    badgeVariant === "dot" ? `${event.color}-dot` : event.color
  ) as VariantProps<typeof agendaEventCardVariants>["color"];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  const plainDescription = event.description
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <EventDetailsDialog event={event}>
      <div
        role="button"
        tabIndex={0}
        className={agendaEventCardVariants({ color })}
        onKeyDown={handleKeyDown}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5">
            {["mixed", "dot"].includes(badgeVariant) && (
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                className="event-dot shrink-0"
              >
                <circle cx="4" cy="4" r="4" />
              </svg>
            )}

            <p className="truncate font-medium">
              {eventCurrentDay != null &&
                eventTotalDays != null &&
                eventTotalDays > 1 && (
                  <span className="mr-1 text-xs font-normal opacity-80">
                    Day {eventCurrentDay} of {eventTotalDays} ·{" "}
                  </span>
                )}
              {event.title}
            </p>
          </div>

          {event.user?.name && (
            <div className="flex items-center gap-1">
              <User className="size-3 shrink-0" />
              <p className="truncate text-xs text-foreground">
                {event.user.name}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Clock className="size-3 shrink-0" />
            <p className="text-xs text-foreground">
              {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
            </p>
          </div>

          {plainDescription && (
            <div className="flex items-start gap-1">
              <Text className="mt-0.5 size-3 shrink-0" />
              <p className="line-clamp-2 text-xs text-foreground">
                {plainDescription}
              </p>
            </div>
          )}
        </div>
      </div>
    </EventDetailsDialog>
  );
}
