import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: string; // ← change from number
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  // Optional: keep original reservation data
  reservation?: {
    full_name: string | null;
    pax: number;
    zone: string;
    status: string;
    email: string;
    phone: string | null;
  };
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
