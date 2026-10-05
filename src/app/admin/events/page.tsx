"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Trash2,
  Search,
  User,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import EventFormModal, {
  EditEventButton,
} from "@/components/sections/EventFormModal";
import DeleteEventModal from "@/components/sections/DeleteEventModal";
import { getEvents } from "@/lib/actions";
import { Event } from "@/lib/types/event";

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  const dateOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  if (sameDay) {
    return `${s.toLocaleDateString(undefined, dateOpts)} · ${s.toLocaleTimeString(undefined, timeOpts)} – ${e.toLocaleTimeString(undefined, timeOpts)}`;
  }
  return `${s.toLocaleDateString(undefined, dateOpts)} – ${e.toLocaleDateString(undefined, dateOpts)}`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getEvents();
      if (result.success) {
        setEvents(result.data);
      } else {
        toast.error("Failed to load events");
        setEvents([]);
      }
    } catch {
      toast.error("Something went wrong while loading events");
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.published_by ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (event.description ?? "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status ?? "—"}</Badge>;
    }
  };

  const openDelete = (event: Event) => {
    setEventToDelete(event);
    setDeleteOpen(true);
  };

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Events
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage your events and schedule
          </p>
        </div>

        <EventFormModal mode="create" onSuccess={fetchEvents} />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Events
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {events.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Published
            </p>
            <p className="mt-1 text-3xl font-semibold text-green-600">
              {events.filter((e) => e.status === "published").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Drafts
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {events.filter((e) => e.status === "draft").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Upcoming
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {
                events.filter(
                  (e) =>
                    new Date(e.start_date) > new Date() &&
                    e.status === "published",
                ).length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Search events, authors…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
        />
      </div>

      {/* Events Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading events...
              </span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-stone-900">
                {searchQuery ? "No matching events" : "No events yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first event to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Event
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Schedule
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Published by
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Status
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Published
                    </th>
                    <th className="py-3.5 pr-6 pl-4 text-right font-medium text-stone-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="group hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-start gap-3">
                          {event.image ? (
                            <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-stone-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={event.image}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-300">
                              <ImageIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-stone-900 truncate">
                              {event.title}
                            </div>
                            {event.description && (
                              <div className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          <span className="text-xs sm:text-sm">
                            {formatDateRange(event.start_date, event.end_date)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-stone-600">
                        {event.published_by ? (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {event.published_by}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-stone-500">
                        {event.published_at
                          ? new Date(event.published_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <EditEventButton
                            event={event}
                            onSuccess={fetchEvents}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={() => openDelete(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteEventModal
        event={eventToDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={fetchEvents}
      />
    </main>
  );
}
