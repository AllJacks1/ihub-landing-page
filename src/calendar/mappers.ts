import type { IEvent } from "@/calendar/interfaces";
import type { TEventColor } from "@/calendar/types";

const statusToColor: Record<string, TEventColor> = {
  pending: "yellow",
  confirmed: "green",
  seated: "blue",
  completed: "gray",
  cancelled: "red",
  no_show: "orange",
};

export function reservationToEvent(r: any): IEvent {
  return {
    id: r.id,
    title: `${r.full_name} (${r.pax} pax)`,
    description: r.notes || `${r.zone} • ${r.status}`,
    startDate: r.start_at,
    endDate: r.end_at,
    color: statusToColor[r.status] || "blue",
    user: {
      id: r.profile_id?.toString() || r.id,
      name: r.full_name,
      picturePath: null,
    },
    reservation: {
      full_name: r.full_name,
      pax: r.pax,
      zone: r.zone,
      status: r.status,
      email: r.email,
      phone: r.phone,
    },
  };
}
