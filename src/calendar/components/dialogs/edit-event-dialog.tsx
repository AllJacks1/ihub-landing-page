// src/calendar/components/dialogs/edit-event-dialog.tsx
"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { useDisclosure } from "@/hooks/use-disclosure";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { updateReservation } from "@/lib/actions";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { IEvent } from "@/calendar/interfaces";
import LazyTiptapEditor from "@/components/editor/LazyTiptapEditor";

const reservationFormSchema = z
  .object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    pax: z.coerce.number().min(1, "At least 1 guest").max(50),
    zone: z.enum(["bistro", "study", "room"]),
    startDate: z.date({ message: "Start date is required" }),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.date({ message: "End date is required" }),
    endTime: z.string().min(1, "End time is required"),
    notes: z.string().optional(),
    status: z.enum([
      "pending",
      "confirmed",
      "seated",
      "completed",
      "cancelled",
      "no_show",
    ]),
  })
  .refine(
    (data) => {
      const start = combineDateAndTime(data.startDate, data.startTime);
      const end = combineDateAndTime(data.endDate, data.endTime);
      return start < end;
    },
    {
      message: "End must be after start",
      path: ["endDate"],
    },
  );

type FormInput = z.input<typeof reservationFormSchema>;
type FormOutput = z.output<typeof reservationFormSchema>;

function combineDateAndTime(date: Date, time: string): Date {
  const [hour, minute] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hour || 0, minute || 0, 0, 0);
  return result;
}

function getTimeString(date: Date): string {
  return format(date, "HH:mm");
}

// Status → color mapping (same as create)
const statusToColor: Record<string, IEvent["color"]> = {
  pending: "yellow",
  confirmed: "green",
  seated: "blue",
  completed: "gray",
  cancelled: "red",
  no_show: "orange",
};

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditEventDialog({ children, event }: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const { setLocalEvents } = useCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  // Prefer data from the mapped reservation object if present
  const reservation = (event as any).reservation;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      full_name: reservation?.full_name ?? event.user.name,
      email: reservation?.email ?? "",
      phone: reservation?.phone ?? "",
      pax: reservation?.pax ?? 2,
      zone: (reservation?.zone as "bistro" | "study" | "room") ?? "bistro",
      startDate: start,
      startTime: getTimeString(start),
      endDate: end,
      endTime: getTimeString(end),
      notes: event.description ?? "",
      status: (reservation?.status as FormOutput["status"]) ?? "pending",
    },
  });

  async function onSubmit(values: FormOutput) {
    setIsSubmitting(true);

    try {
      const startAt = combineDateAndTime(values.startDate, values.startTime);
      const endAt = combineDateAndTime(values.endDate, values.endTime);

      const result = await updateReservation(String(event.id), {
        full_name: values.full_name,
        email: values.email,
        phone: values.phone || null,
        pax: values.pax,
        zone: values.zone,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: values.notes || null,
        status: values.status,
      });

      if (!result.success) {
        toast.error(result.error ?? "Failed to update reservation");
        return;
      }

      toast.success("Reservation updated");

      // Optimistic local update
      setLocalEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                title: `${values.full_name} (${values.pax} pax)`,
                description:
                  values.notes || `${values.zone} • ${values.status}`,
                startDate: startAt.toISOString(),
                endDate: endAt.toISOString(),
                color: statusToColor[values.status] ?? "blue",
                user: {
                  ...e.user,
                  name: values.full_name,
                },
                reservation: {
                  pax: values.pax,
                  zone: values.zone,
                  status: values.status,
                  email: values.email,
                  phone: values.phone ?? null,
                  full_name: values.full_name,
                },
              }
            : e,
        ),
      );

      onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const DateTimeField = ({
    dateName,
    timeName,
    label,
  }: {
    dateName: "startDate" | "endDate";
    timeName: "startTime" | "endTime";
    label: string;
  }) => {
    const dateValue = form.watch(dateName);
    const timeValue = form.watch(timeName);
    const dateError = form.formState.errors[dateName];
    const timeError = form.formState.errors[timeName];

    return (
      <Field data-invalid={!!dateError || !!timeError}>
        <FieldLabel className="text-xs font-medium uppercase tracking-wider text-stone-500">
          {label}
        </FieldLabel>
        <div className="mt-1.5 grid grid-cols-[1fr_110px] gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#F36509]/20 focus:border-[#F36509]",
                    !dateValue ? "text-stone-400" : "text-stone-900",
                  )}
                >
                  {dateValue ? (
                    format(dateValue, "PPP")
                  ) : (
                    <span>Pick date</span>
                  )}
                  <CalendarIcon className="h-4 w-4 text-stone-400" />
                </button>
              }
            ></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => {
                  if (date) {
                    form.setValue(dateName, date, { shouldValidate: true });
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="time"
              value={timeValue}
              onChange={(e) =>
                form.setValue(timeName, e.target.value, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-2 text-sm text-stone-900 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#F36509]/20 focus:border-[#F36509]",
                !timeValue && "text-stone-400",
              )}
            />
          </div>
        </div>
        <FieldError
          errors={[dateError, timeError]}
          className="mt-1.5 text-xs text-red-600"
        />
      </Field>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger>{children}</DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Reservation</DialogTitle>
        </DialogHeader>

        <form
          id="edit-reservation-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 py-2"
        >
          <FieldSet>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.full_name}>
                <FieldLabel
                  htmlFor="edit_full_name"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Full Name
                </FieldLabel>
                <Input
                  id="edit_full_name"
                  placeholder="Juan Dela Cruz"
                  className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  {...form.register("full_name")}
                />
                <FieldError
                  errors={[form.formState.errors.full_name]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>

              <Field data-invalid={!!form.formState.errors.email}>
                <FieldLabel
                  htmlFor="edit_email"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Email
                </FieldLabel>
                <Input
                  id="edit_email"
                  type="email"
                  placeholder="juan@email.com"
                  className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  {...form.register("email")}
                />
                <FieldError
                  errors={[form.formState.errors.email]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.phone}>
                <FieldLabel
                  htmlFor="edit_phone"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Phone{" "}
                  <span className="font-normal normal-case text-stone-400">
                    (optional)
                  </span>
                </FieldLabel>
                <Input
                  id="edit_phone"
                  placeholder="+63 9XX XXX XXXX"
                  className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  {...form.register("phone")}
                />
                <FieldError
                  errors={[form.formState.errors.phone]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>

              <Field data-invalid={!!form.formState.errors.pax}>
                <FieldLabel
                  htmlFor="edit_pax"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500"
                >
                  Guests
                </FieldLabel>
                <Input
                  id="edit_pax"
                  type="number"
                  min={1}
                  max={50}
                  className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  {...form.register("pax")}
                />
                <FieldError
                  errors={[form.formState.errors.pax]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!form.formState.errors.zone}>
                <FieldLabel className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Zone
                </FieldLabel>
                <Select
                  value={form.watch("zone")}
                  onValueChange={(value) => {
                    if (value)
                      form.setValue("zone", value as FormOutput["zone"], {
                        shouldValidate: true,
                      });
                  }}
                >
                  <SelectTrigger className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bistro">Bistro</SelectItem>
                    <SelectItem value="study">Study Zone</SelectItem>
                    <SelectItem value="room">Private Room</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError
                  errors={[form.formState.errors.zone]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>

              <Field data-invalid={!!form.formState.errors.status}>
                <FieldLabel className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Status
                </FieldLabel>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => {
                    if (value)
                      form.setValue("status", value as FormOutput["status"], {
                        shouldValidate: true,
                      });
                  }}
                >
                  <SelectTrigger className="mt-1.5 rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="seated">Seated</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError
                  errors={[form.formState.errors.status]}
                  className="mt-1.5 text-xs text-red-600"
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <DateTimeField
                dateName="startDate"
                timeName="startTime"
                label="Start"
              />
              <DateTimeField
                dateName="endDate"
                timeName="endTime"
                label="End"
              />
            </FieldGroup>

            <Field data-invalid={!!form.formState.errors.notes}>
              <FieldLabel
                htmlFor="edit_notes"
                className="text-xs font-medium uppercase tracking-wider text-stone-500"
              >
                Notes{" "}
                <span className="font-normal normal-case text-stone-400">
                  (optional)
                </span>
              </FieldLabel>

              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <LazyTiptapEditor
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Special requests, allergies, etc."
                    className="mt-1.5 rounded-lg border-stone-200"
                  />
                )}
              />

              <FieldError
                errors={[form.formState.errors.notes]}
                className="mt-1.5 text-xs text-red-600"
              />
            </Field>
          </FieldSet>
        </form>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Cancel
              </Button>
            }
          ></DialogClose>

          <Button
            form="edit-reservation-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-[#F36509] hover:bg-[#F36509]/90"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
