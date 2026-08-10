"use client";

import Link from "next/link";
import {
  Columns,
  Grid3x3,
  List,
  Plus,
  Grid2x2,
  CalendarRange,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

import { UserSelect } from "@/calendar/components/header/user-select";
import { TodayButton } from "@/calendar/components/header/today-button";
import { DateNavigator } from "@/calendar/components/header/date-navigator";
import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

const VIEW_OPTIONS = [
  {
    value: "day" as const,
    href: "/admin/reservations/calendar/day",
    icon: List,
    label: "Day view",
  },
  {
    value: "week" as const,
    href: "/admin/reservations/calendar/week",
    icon: Columns,
    label: "Week view",
  },
  {
    value: "month" as const,
    href: "/admin/reservations/calendar",
    icon: Grid2x2,
    label: "Month view",
  },
  {
    value: "year" as const,
    href: "/admin/reservations/calendar/year",
    icon: Grid3x3,
    label: "Year view",
  },
  {
    value: "agenda" as const,
    href: "/admin/reservations/calendar/agenda",
    icon: CalendarRange,
    label: "Agenda view",
  },
];

export function CalendarHeader({ view, events }: IProps) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2">
          <ButtonGroup>
            {VIEW_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = view === option.value;

              return (
                <Button
                  key={option.value}
                  size="icon"
                  variant={isActive ? "default" : "outline"}
                  aria-label={option.label}
                  aria-current={isActive ? "page" : undefined}
                  render={<Link href={option.href} />}
                >
                  <Icon strokeWidth={1.8} />
                </Button>
              );
            })}
          </ButtonGroup>

          <UserSelect />
        </div>

        <AddEventDialog>
          <Button className="w-full sm:w-auto">
            <Plus data-icon="inline-start" />
            Add Reservation
          </Button>
        </AddEventDialog>
      </div>
    </div>
  );
}
