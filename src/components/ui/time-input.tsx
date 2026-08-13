"use client";

import { TimeField, DateInput, DateSegment } from "react-aria-components";
import type { TimeValue } from "react-aria-components";
import { cn } from "@/lib/utils";

interface TimeInputProps {
  value?: TimeValue | null;
  onChange?: (value: TimeValue | null) => void;
  hourCycle?: 12 | 24;
  granularity?: "hour" | "minute" | "second";
  id?: string;
  className?: string;
}

export function TimeInput({
  value,
  onChange,
  hourCycle = 24,
  granularity = "minute",
  className,
}: TimeInputProps) {
  return (
    <TimeField
      value={value}
      onChange={onChange}
      hourCycle={hourCycle}
      granularity={granularity}
      className={cn("flex", className)}
    >
      <DateInput
        className={cn(
          "inline-flex h-9 items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-xs",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        )}
      >
        {(segment) => (
          <DateSegment segment={segment} className="px-0.5 outline-none" />
        )}
      </DateInput>
    </TimeField>
  );
}
