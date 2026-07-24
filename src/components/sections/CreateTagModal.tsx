"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { createTag } from "@/lib/actions"; // ← Make sure path is correct

interface CreateTagModalProps {
  onTagCreated?: () => void;
}

export default function CreateTagModal({ onTagCreated }: CreateTagModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug:
        prev.slug === "" || prev.slug === generateSlug(prev.name)
          ? generateSlug(name)
          : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);

    try {
      const result = await createTag({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      });

      if (result.success) {
        toast.success("Tag created successfully!");
        onTagCreated?.();
        setOpen(false);
        setFormData({ name: "", slug: "" });
      } else {
        toast.error(result.error || "Failed to create tag");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button className="bg-[#F36509] hover:bg-[#d95508] text-white">
          <Plus className="mr-2 h-4 w-4" />
          New Tag
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]/10">
              <Tag className="h-5 w-5 text-[#F36509]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Create New Tag
              </DialogTitle>
              <p className="text-sm text-stone-500 mt-1">
                Add a new tag to organize your posts
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Tag Name <span className="text-[#F36509]">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g. JavaScript"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, slug: e.target.value }))
              }
              placeholder="javascript"
              className="font-mono"
            />
            <p className="text-xs text-stone-400">
              Used in URLs. Auto-generated from name.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="bg-[#F36509] hover:bg-[#d95508]"
            >
              {isLoading ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
