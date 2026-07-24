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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderTree, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCategory } from "@/lib/actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string | null;
  parent_name: string;
}

interface CreateCategoryModalProps {
  categories?: Category[];
  onCategoryCreated?: () => void;
}

export default function CreateCategoryModal({
  categories = [],
  onCategoryCreated,
}: CreateCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: null as string | null,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      parent_id: formData.parent_id,
    };

    const result = await createCategory(payload);

    if (result.success) {
      toast.success("Category created successfully!");
      onCategoryCreated?.();

      setFormData({
        name: "",
        slug: "",
        description: "",
        parent_id: null,
      });

      setOpen(false);
    } else {
      toast.error(result.error || "Failed to create category");
    }

    setIsLoading(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <div
          role="button"
          tabIndex={0}
          className="inline-flex items-center h-10 px-6 rounded-full bg-[#F36509] text-white font-semibold text-sm cursor-pointer select-none shadow-sm transition-all duration-200 ease-out hover:bg-[#d95508] hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36509]/40 focus-visible:ring-offset-2"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
            }
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Category
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border border-stone-200 bg-white shadow-xl rounded-xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]/10">
              <FolderTree className="h-5 w-5 text-[#F36509]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-stone-900">
                Create Category
              </DialogTitle>
              <p className="text-sm text-stone-500 mt-0.5">
                Add a new category to organize your posts
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-stone-700"
              >
                Name <span className="text-[#F36509]">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Technology"
                required
                className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors placeholder:text-stone-400"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label
                htmlFor="slug"
                className="text-sm font-medium text-stone-700"
              >
                Slug
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="technology"
                className="font-mono text-sm border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors placeholder:text-stone-400"
              />
              <p className="text-xs text-stone-400">
                Used in the URL. Auto-generated from name.
              </p>
            </div>

            {/* Parent Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-stone-700">
                Parent Category
              </Label>

              <Select
                value={formData.parent_id || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_id: value || null,
                  }))
                }
              >
                <SelectTrigger className="w-full min-w-70 border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors">
                  <SelectValue>
                    {formData.parent_id
                      ? categories.find((c) => c.id === formData.parent_id)
                          ?.name || formData.parent_id
                      : "None — top level category"}
                  </SelectValue>
                </SelectTrigger>

                <SelectContent className="border-stone-200 rounded-lg">
                  <SelectItem value="">None — top level category</SelectItem>

                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.parent_name ? `${cat.parent_name} > ` : ""}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-stone-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this category..."
                rows={3}
                className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors resize-none placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#F36509] hover:bg-[#d95508] text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
