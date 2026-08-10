"use client";

import { format, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  ItemGroup,
} from "@/components/ui/item";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditEventDialog } from "@/calendar/components/dialogs/edit-event-dialog";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  seated: "secondary",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

const ZONE_LABEL: Record<string, string> = {
  bistro: "Bistro",
  study: "Study Zone",
  room: "Private Room",
};

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const reservation = event.reservation;

  const status = reservation?.status ?? "pending";
  const zone = reservation?.zone ?? "—";
  const pax = reservation?.pax;
  const email = reservation?.email;
  const phone = reservation?.phone;
  const guestName = reservation?.full_name ?? event.user.name;

  return (
    <Dialog>
      <DialogTrigger render={children as React.ReactElement} nativeButton={false} />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="text-balance">{guestName}</DialogTitle>
            <Badge variant={STATUS_VARIANT[status] ?? "outline"}>
              {status.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <ItemGroup className="gap-1">
          {pax != null && (
            <Item size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Users />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Guests</ItemTitle>
                <ItemDescription>
                  {pax} {pax === 1 ? "person" : "people"}
                </ItemDescription>
              </ItemContent>
            </Item>
          )}

          <Item size="sm" variant="muted">
            <ItemMedia variant="icon">
              <MapPin />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Zone</ItemTitle>
              <ItemDescription>{ZONE_LABEL[zone] ?? zone}</ItemDescription>
            </ItemContent>
          </Item>

          <Item size="sm" variant="muted">
            <ItemMedia variant="icon">
              <Calendar />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Start</ItemTitle>
              <ItemDescription>
                {format(startDate, "EEE, MMM d · h:mm a")}
              </ItemDescription>
            </ItemContent>
          </Item>

          <Item size="sm" variant="muted">
            <ItemMedia variant="icon">
              <Clock />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>End</ItemTitle>
              <ItemDescription>
                {format(endDate, "EEE, MMM d · h:mm a")}
              </ItemDescription>
            </ItemContent>
          </Item>

          {email && (
            <Item size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Mail />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Email</ItemTitle>
                <ItemDescription>{email}</ItemDescription>
              </ItemContent>
            </Item>
          )}

          {phone && (
            <Item size="sm" variant="muted">
              <ItemMedia variant="icon">
                <Phone />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Phone</ItemTitle>
                <ItemDescription>{phone}</ItemDescription>
              </ItemContent>
            </Item>
          )}

          {event.description && (
            <Item size="sm" variant="muted">
              <ItemMedia variant="icon">
                <StickyNote />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Notes</ItemTitle>
                <div
                  className="prose prose-sm prose-stone max-w-none text-muted-foreground
          prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0
          prose-headings:my-1 prose-headings:text-foreground"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </ItemContent>
            </Item>
          )}
        </ItemGroup>

        <DialogFooter>
          <EditEventDialog event={event}>
            <Button type="button" variant="outline">
              Edit
            </Button>
          </EditEventDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
