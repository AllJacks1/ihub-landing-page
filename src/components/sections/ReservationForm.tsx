"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarIcon,
  User,
  MapPin,
  ShieldCheck,
  ClipboardList,
  ChevronDownIcon,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createReservation } from "@/lib/actions";

const formSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  pax: z.coerce.number().min(1).max(50),
  zone: z.enum(["bistro", "study", "room"]),
  start_at: z.date(),
  end_at: z.date(),
  notes: z.string().optional(),
  status: z
    .enum([
      "pending",
      "confirmed",
      "seated",
      "completed",
      "cancelled",
      "no_show",
    ])
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  mode: "admin" | "client";
}

function setTimeOnDate(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function getTimeString(date: Date | null | undefined): string {
  if (!date) return "";
  return format(date, "HH:mm");
}

export function ReservationForm({ mode }: Props) {
  const router = useRouter();

  type FormInput = z.input<typeof formSchema>;
  type FormOutput = z.output<typeof formSchema>;

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      pax: 2,
      zone: "bistro",
      notes: "",
      status: "pending",
    },
  });

  async function onSubmit(values: FormValues) {
    const formData = new FormData();

    formData.append("full_name", values.full_name);
    formData.append("email", values.email);
    if (values.phone) formData.append("phone", values.phone);
    formData.append("pax", String(values.pax));
    formData.append("zone", values.zone);
    formData.append("start_at", values.start_at.toISOString());
    formData.append("end_at", values.end_at.toISOString());
    if (values.notes) formData.append("notes", values.notes);
    if (mode === "admin" && values.status) {
      formData.append("status", values.status);
    }
    formData.append("mode", mode);

    const result = await createReservation(null, formData);

    if (!result.success) {
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            message: messages?.[0],
          });
        });
      }
      toast.error(result.message ?? "Something went wrong");
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  const DateTimeField = ({
    name,
    label,
  }: {
    name: "start_at" | "end_at";
    label: string;
  }) => {
    const value = form.watch(name);
    const error = form.formState.errors[name];

    const onDateChange = (date: Date | undefined) => {
      if (!date) return;
      const current = value || new Date();
      const merged = setTimeOnDate(date, getTimeString(current));
      form.setValue(name, merged, { shouldValidate: true });
    };

    const onTimeChange = (time: string) => {
      const current = value || new Date();
      form.setValue(name, setTimeOnDate(current, time), {
        shouldValidate: true,
      });
    };

    return (
      <Field data-invalid={!!error}>
        <FieldLabel className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          {label}
        </FieldLabel>
        <div className="mt-1.5 grid grid-cols-[1fr_120px] gap-3">
          {/* Date picker */}
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-normal transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#F36509]/20 focus:border-[#F36509]",
                    !value ? "text-stone-400" : "text-stone-900",
                  )}
                >
                  {value ? format(value, "PPP") : <span>Pick date</span>}
                  <CalendarIcon className="h-4 w-4 text-stone-400" />
                </button>
              }
            ></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value}
                onSelect={onDateChange}
              />
            </PopoverContent>
          </Popover>

          {/* Time picker */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="time"
              value={getTimeString(value)}
              onChange={(e) => onTimeChange(e.target.value)}
              className={cn(
                "h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-stone-900 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#F36509]/20 focus:border-[#F36509]",
                !value && "text-stone-400",
              )}
            />
          </div>
        </div>
        <FieldError errors={[error]} className="text-xs text-red-600 mt-1.5" />
      </Field>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card className="mt-8 border-stone-200 bg-white overflow-hidden rounded-xl">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FieldSet>
              {/* ── Guest Details ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#F36509]/10 p-2">
                    <User className="h-4 w-4 text-[#F36509]" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900">
                    Guest Details
                  </h2>
                </div>

                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!form.formState.errors.full_name}>
                    <FieldLabel
                      htmlFor="full_name"
                      className="text-xs font-medium text-stone-500 uppercase tracking-wider"
                    >
                      Full Name
                    </FieldLabel>
                    <Input
                      id="full_name"
                      placeholder="Juan Dela Cruz"
                      className="mt-1.5 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 transition-colors"
                      {...form.register("full_name")}
                    />
                    <FieldError
                      errors={[form.formState.errors.full_name]}
                      className="text-xs text-red-600 mt-1.5"
                    />
                  </Field>

                  <Field data-invalid={!!form.formState.errors.email}>
                    <FieldLabel
                      htmlFor="email"
                      className="text-xs font-medium text-stone-500 uppercase tracking-wider"
                    >
                      Email
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="juan@email.com"
                      className="mt-1.5 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 transition-colors"
                      {...form.register("email")}
                    />
                    <FieldError
                      errors={[form.formState.errors.email]}
                      className="text-xs text-red-600 mt-1.5"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={!!form.formState.errors.phone}>
                    <FieldLabel
                      htmlFor="phone"
                      className="text-xs font-medium text-stone-500 uppercase tracking-wider"
                    >
                      Phone{" "}
                      <span className="normal-case text-stone-400 font-normal">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Input
                      id="phone"
                      placeholder="+63 9XX XXX XXXX"
                      className="mt-1.5 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 transition-colors"
                      {...form.register("phone")}
                    />
                    <FieldError
                      errors={[form.formState.errors.phone]}
                      className="text-xs text-red-600 mt-1.5"
                    />
                  </Field>

                  <Field data-invalid={!!form.formState.errors.pax}>
                    <FieldLabel
                      htmlFor="pax"
                      className="text-xs font-medium text-stone-500 uppercase tracking-wider"
                    >
                      Number of Guests
                    </FieldLabel>
                    <Input
                      id="pax"
                      type="number"
                      min={1}
                      className="mt-1.5 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 transition-colors"
                      {...form.register("pax")}
                    />
                    <FieldError
                      errors={[form.formState.errors.pax]}
                      className="text-xs text-red-600 mt-1.5"
                    />
                  </Field>
                </FieldGroup>
              </div>

              <div className="border-t border-stone-100" />

              {/* ── Reservation Details ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#F36509]/10 p-2">
                    <MapPin className="h-4 w-4 text-[#F36509]" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900">
                    Reservation Details
                  </h2>
                </div>

                <Field data-invalid={!!form.formState.errors.zone}>
                  <FieldLabel className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Zone
                  </FieldLabel>
                  <Select
                    onValueChange={(value) =>
                      form.setValue("zone", value as FormValues["zone"], {
                        shouldValidate: true,
                      })
                    }
                    defaultValue={form.getValues("zone")}
                  >
                    <SelectTrigger className="mt-1.5 rounded-lg border-stone-200 focus:ring-[#F36509]/20 focus:border-[#F36509]">
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
                    className="text-xs text-red-600 mt-1.5"
                  />
                </Field>

                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <DateTimeField name="start_at" label="Start" />
                  <DateTimeField name="end_at" label="End" />
                </FieldGroup>
              </div>

              <div className="border-t border-stone-100" />

              {/* ── Additional Information ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#F36509]/10 p-2">
                    <ClipboardList className="h-4 w-4 text-[#F36509]" />
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-stone-900">
                    Additional Information
                  </h2>
                </div>

                <Field data-invalid={!!form.formState.errors.notes}>
                  <FieldLabel
                    htmlFor="notes"
                    className="text-xs font-medium text-stone-500 uppercase tracking-wider"
                  >
                    Notes / Special Requests
                  </FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="Allergies, celebration, preferred table..."
                    className="mt-1.5 resize-none border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 transition-colors min-h-[100px]"
                    {...form.register("notes")}
                  />
                  <FieldError
                    errors={[form.formState.errors.notes]}
                    className="text-xs text-red-600 mt-1.5"
                  />
                </Field>
              </div>
            </FieldSet>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full h-11 bg-[#F36509] hover:bg-[#d95a08] text-white rounded-lg font-medium transition-colors"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : mode === "client"
                    ? "Submit Reservation"
                    : "Create Reservation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
