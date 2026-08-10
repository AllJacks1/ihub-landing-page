"use client";

import { MapPin } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ZONES = [
  { value: "all", label: "All Zones" },
  { value: "bistro", label: "Bistro" },
  { value: "study", label: "Study Zone" },
  { value: "room", label: "Private Room" },
] as const;

export function UserSelect() {
  const { selectedUserId, setSelectedUserId } = useCalendar();

  return (
    <Select
      value={selectedUserId}
      onValueChange={(value) => {
        if (value) setSelectedUserId(value as typeof selectedUserId);
      }}
    >
      <SelectTrigger className="w-full min-w-40 md:w-48">
        <MapPin className="size-4 text-muted-foreground" />
        <SelectValue placeholder="Filter by zone" />
      </SelectTrigger>

      <SelectContent align="end">
        {ZONES.map((zone) => (
          <SelectItem key={zone.value} value={zone.value}>
            {zone.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
