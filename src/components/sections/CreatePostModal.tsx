"use client";

import { useEffect, useState } from "react";
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
import { Plus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { createPost, createTag, getCategories, getTags } from "@/lib/actions";
import { toast } from "sonner";
import { Badge } from "../ui/badge";

const LazyTiptapEditor = dynamic(
  () => import("@/components/editor/LazyTiptapEditor"),
  { ssr: false },
);

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  parent_name?: string | null;
}

interface FormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  category_id: string | null;
  status: "draft" | "published" | "archived";
  published_at: string;
}

interface CreatePostModalProps {
  onPostCreated?: () => void;
}

export default function CreatePostModal({
  onPostCreated,
}: CreatePostModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    slug: "",
    summary: "",
    content: "",
    featured_image: "",
    category_id: "",
    status: "draft",
    published_at: "",
  });

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const result = await getCategories();
      if (result.success) {
        setCategories(result.data);
      } else {
        toast.error("Failed to load categories");
      }
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchAllTags = async () => {
    setIsLoadingTags(true);
    try {
      const result = await getTags();
      if (result.success) {
        setAvailableTags(result.data);
      } else {
        toast.error("Failed to load tags");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load tags");
    } finally {
      setIsLoadingTags(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchAllTags();
    }
  }, [open]);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug:
        prev.slug === "" || prev.slug === generateSlug(prev.title)
          ? generateSlug(title)
          : prev.slug,
    }));
  };

  const addTag = (tag: Tag) => {
    if (!selectedTags.find((t) => t.id === tag.id)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const removeTag = (id: string) => {
    setSelectedTags((prev) => prev.filter((t) => t.id !== id));
  };

  const createAndAddNewTag = async () => {
    if (!newTagInput.trim()) return;

    setIsCreatingTag(true);
    try {
      const result = await createTag({
        name: newTagInput.trim(),
        slug: newTagInput.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });

      if (result.success) {
        const newTag = result.data;
        setAvailableTags((prev) => [...prev, newTag]);
        addTag(newTag);
        setNewTagInput("");
        toast.success("New tag created and added");
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      toast.error("Failed to create tag");
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        published_at: formData.published_at
          ? new Date(formData.published_at).toISOString()
          : null,
      };

      const result = await createPost(payload);

      if (result.success) {
        setOpen(false);
        setFormData({
          title: "",
          slug: "",
          summary: "",
          content: "",
          featured_image: "",
          category_id: "",
          status: "draft",
          published_at: "",
        });

        toast.success("Post created successfully!", {
          description: "Your post has been saved.",
          duration: 4000,
        });
      } else {
        toast.error("Failed to create post", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <Plus className="mr-2 h-4 w-4 shrink-0" />
          New Post
        </div>
      </DialogTrigger>

      <DialogContent className="min-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 bg-white shadow-xl rounded-xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Create New Post
            </DialogTitle>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the details below to publish a new post.
          </p>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <Label
                htmlFor="title"
                className="text-sm font-medium text-slate-700"
              >
                Title <span className="text-[#F36509]">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleTitleChange}
                placeholder="Enter post title..."
                required
                className="border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <Label
                htmlFor="slug"
                className="text-sm font-medium text-slate-700"
              >
                Slug
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                placeholder="post-slug"
                className="font-mono text-sm border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400">
                Used in the URL. Auto-generated from title.
              </p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">
                Category
              </Label>
              <Select
                value={formData.category_id || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_id: value,
                  }))
                }
              >
                <SelectTrigger className="w-full min-w-[280px] border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors text-slate-600">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="border-slate-200 rounded-lg">
                  <SelectItem value="">No Category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.parent_name ? `${cat.parent_name} > ` : ""}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <Label
                htmlFor="summary"
                className="text-sm font-medium text-slate-700"
              >
                Summary
              </Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, summary: e.target.value }))
                }
                placeholder="Brief summary for previews..."
                rows={3}
                className="border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors resize-none placeholder:text-slate-400"
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-1.5">
              <Label
                htmlFor="featured_image"
                className="text-sm font-medium text-slate-700"
              >
                Featured Image
              </Label>
              <Input
                id="featured_image"
                type="url"
                value={formData.featured_image}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    featured_image: e.target.value,
                  }))
                }
                placeholder="https://example.com/image.jpg"
                className="border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Status & Published At */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => {
                    if (
                      value &&
                      (value === "draft" ||
                        value === "published" ||
                        value === "archived")
                    ) {
                      setFormData((prev) => ({ ...prev, status: value }));
                    }
                  }}
                >
                  <SelectTrigger className="border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors text-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 rounded-lg">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="published_at"
                  className="text-sm font-medium text-slate-700"
                >
                  Published At
                </Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={formData.published_at}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      published_at: e.target.value,
                    }))
                  }
                  className="border-slate-200 focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0 rounded-lg transition-colors text-slate-600"
                />
              </div>
            </div>

            {/* === TAGS SECTION === */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tags</Label>

              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="pl-3 pr-2 py-1"
                  >
                    #{tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="ml-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Tag Selector + Create New */}
              <div className="flex gap-2">
                <Select
                  onValueChange={(value) => {
                    const tag = availableTags.find((t) => t.id === value);
                    if (tag) addTag(tag);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select existing tags..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        #{tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Input
                    placeholder="New tag name"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="w-52"
                  />
                  <Button
                    type="button"
                    onClick={createAndAddNewTag}
                    disabled={!newTagInput.trim() || isCreatingTag}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label
                htmlFor="content"
                className="text-sm font-medium text-slate-700"
              >
                Content <span className="text-[#F36509]">*</span>
              </Label>
              <LazyTiptapEditor
                value={formData.content}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, content: value }))
                }
                placeholder="Write your post content here..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#F36509] hover:bg-[#d95508] text-white rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
