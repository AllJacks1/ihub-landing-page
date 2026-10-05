"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Event } from "@/lib/types/event";
import {
  createEvent,
  updateEvent,
  getCurrentUser,
  uploadEventImage,
} from "@/lib/actions";

interface EventFormModalProps {
  mode: "create" | "edit";
  event?: Event | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess: () => void;
  showTrigger?: boolean;
}

const emptyForm = {
  title: "",
  description: "",
  image: "",
  start_date: "",
  end_date: "",
  published_at: "",
  published_by: "",
  status: "draft" as Event["status"],
};

function toLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export default function EventFormModal({
  mode,
  event,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
  showTrigger = mode === "create",
}: EventFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const user = await getCurrentUser();
        if (!cancelled && user) {
          setCurrentUserName(user.full_name);
        }
      } catch {
        // silent
      }
    }

    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageFile(null);

    if (mode === "edit" && event) {
      setForm({
        title: event.title ?? "",
        description: event.description ?? "",
        image: event.image ?? "",
        start_date: toLocalInputValue(event.start_date),
        end_date: toLocalInputValue(event.end_date),
        published_at: toLocalInputValue(event.published_at),
        published_by: event.published_by ?? "",
        status: event.status ?? "draft",
      });
      setImagePreview(event.image ?? "");
    } else {
      setForm({
        ...emptyForm,
        published_by: currentUserName ?? "",
      });
      setImagePreview("");
    }
  }, [open, mode, event, currentUserName]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const preview = URL.createObjectURL(file);
    objectUrlRef.current = preview;

    setImageFile(file);
    setImagePreview(preview);
    // Keep form.image empty until we have the real public URL
    setForm((prev) => ({ ...prev, image: "" }));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.start_date || !form.end_date) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(form.end_date) < new Date(form.start_date)) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);
    try {
      const author = form.published_by.trim() || currentUserName || undefined;

      // ── Upload new image if the user selected one ────────────────────────
      let imageUrl: string | undefined = form.image.trim() || undefined;

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);

        const uploadResult = await uploadEventImage(fd);

        if (!uploadResult.success || !uploadResult.url) {
          toast.error(uploadResult.error || "Failed to upload image");
          setIsSubmitting(false);
          return;
        }

        imageUrl = uploadResult.url;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        image: imageUrl,
        start_date: fromLocalInputValue(form.start_date)!,
        end_date: fromLocalInputValue(form.end_date)!,
        published_at: fromLocalInputValue(form.published_at),
        published_by: author,
        status: form.status,
      };

      const result =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(event!.id, payload);

      if (result.success) {
        toast.success(mode === "create" ? "Event created" : "Event updated");
        setOpen(false);
        onSuccess();
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button className="bg-[#F36509] hover:bg-[#E55A00] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          }
        ></DialogTrigger>
      )}

      <DialogContent className="sm:max-w-lg border-stone-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-stone-900">
            {mode === "create" ? "Create event" : "Edit event"}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {mode === "create"
              ? "Add a new event to your calendar."
              : "Update the details of this event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-stone-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Event title"
              className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-stone-700">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="What is this event about?"
              rows={3}
              className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 resize-none"
            />
          </div>

          {/* Image upload zone */}
          <div className="space-y-2">
            <Label className="text-stone-700">Image</Label>

            {imagePreview ? (
              <div className="relative overflow-hidden rounded-lg border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  flex cursor-pointer flex-col items-center justify-center gap-2
                  rounded-lg border-2 border-dashed px-4 py-8 text-center transition
                  ${
                    isDragging
                      ? "border-[#F36509] bg-orange-50"
                      : "border-stone-300 bg-stone-50 hover:border-[#F36509]/60 hover:bg-orange-50/50"
                  }
                `}
              >
                <div className="rounded-full bg-stone-100 p-3">
                  {isDragging ? (
                    <Upload className="h-6 w-6 text-[#F36509]" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-stone-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-stone-700">
                    {isDragging
                      ? "Drop image here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-stone-500">
                    PNG, JPG, GIF up to 5 MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-stone-700">
                Start <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
                className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-stone-700">
                End <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
                className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="published_at" className="text-stone-700">
                Published at
              </Label>
              <Input
                id="published_at"
                name="published_at"
                type="datetime-local"
                value={form.published_at}
                onChange={handleChange}
                className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="published_by" className="text-stone-700">
                Published by
              </Label>
              <Input
                id="published_by"
                name="published_by"
                value={form.published_by}
                readOnly
                tabIndex={-1}
                placeholder="Loading…"
                className="border-stone-200 bg-stone-50 text-stone-600 cursor-default focus:border-stone-200 focus:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-stone-700">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  status: value as Event["status"],
                }))
              }
            >
              <SelectTrigger className="border-stone-200 focus:ring-[#F36509]/20">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="border-stone-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#F36509] hover:bg-[#E55A00] text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : mode === "create" ? (
                "Create event"
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditEventButton({
  event,
  onSuccess,
}: {
  event: Event;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <EventFormModal
        mode="edit"
        event={event}
        open={open}
        onOpenChange={setOpen}
        onSuccess={onSuccess}
        showTrigger={false}
      />
    </>
  );
}
