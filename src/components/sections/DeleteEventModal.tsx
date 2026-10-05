"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import HoldToDeleteButton from "./HoldToDeleteButton";
import { deleteEvent } from "@/lib/actions";
import { Event } from "@/lib/types/event";

interface DeleteEventModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteEventModal({
  event,
  open,
  onOpenChange,
  onDeleted,
}: DeleteEventModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event) return;
    setIsDeleting(true);
    try {
      const result = await deleteEvent(event.id);
      if (result.success) {
        toast.success("Event deleted");
        onOpenChange(false);
        onDeleted();
      } else {
        toast.error(result.error || "Failed to delete event");
      }
    } catch {
      toast.error("Something went wrong while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-stone-200">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-stone-900">
            Delete event
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            This action cannot be undone. Hold the button below for 3 seconds to
            permanently delete{" "}
            <span className="font-medium text-stone-800">
              {event?.title ?? "this event"}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-stone-200"
          >
            Cancel
          </Button>
          <HoldToDeleteButton
            onConfirm={handleDelete}
            isLoading={isDeleting}
            holdDurationMs={3000}
            label="Hold to delete"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
