"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Plus, X, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import { createPost, createTag, getCategories, getTags } from "@/lib/actions";
import { toast } from "sonner";

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

export default function CreatePostPage() {
  const router = useRouter();
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
    } catch {
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
    } catch {
      toast.error("Failed to load tags");
    } finally {
      setIsLoadingTags(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAllTags();
  }, []);

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
    } catch {
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
        // If your createPost action accepts tags, include them here:
        // tag_ids: selectedTags.map((t) => t.id),
      };

      const result = await createPost(payload);

      if (result.success) {
        toast.success("Post created successfully!", {
          description: "Your post has been saved.",
          duration: 4000,
        });
        router.push("/posts"); // or wherever your posts list lives
      } else {
        toast.error("Failed to create post", {
          description: result.error,
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -ml-2 text-stone-500 hover:text-stone-900"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
              Create Post
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-stone-500 pl-9">
            Write and publish a new blog post
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="mt-8 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-8 space-y-8">
              {/* Title */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="title"
                  className="text-sm font-medium text-stone-700"
                >
                  Title <span className="text-[#F36509]">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter post title..."
                  required
                  className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg"
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
                  placeholder="post-slug"
                  className="font-mono text-sm border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg"
                />
                <p className="text-xs text-stone-400">
                  Used in the URL. Auto-generated from title.
                </p>
              </div>

              {/* Category + Status + Published At */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-stone-700">
                    Category
                  </Label>
                  <Select
                    value={formData.category_id || ""}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: value || null,
                      }))
                    }
                    disabled={isLoadingCategories}
                  >
                    <SelectTrigger className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg">
                      <SelectValue
                        placeholder={
                          isLoadingCategories
                            ? "Loading..."
                            : "Select a category"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-stone-200 rounded-lg">
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.parent_name ? `${cat.parent_name} › ` : ""}
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-stone-700">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => {
                      if (
                        value === "draft" ||
                        value === "published" ||
                        value === "archived"
                      ) {
                        setFormData((prev) => ({ ...prev, status: value }));
                      }
                    }}
                  >
                    <SelectTrigger className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-stone-200 rounded-lg">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="published_at"
                    className="text-sm font-medium text-stone-700"
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
                    className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="summary"
                  className="text-sm font-medium text-stone-700"
                >
                  Summary
                </Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  placeholder="Brief summary for previews and SEO..."
                  rows={3}
                  className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg resize-none"
                />
              </div>

              {/* Featured Image */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="featured_image"
                  className="text-sm font-medium text-stone-700"
                >
                  Featured Image URL
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
                  className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg"
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-stone-700">
                  Tags
                </Label>

                {/* Selected tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="pl-3 pr-1.5 py-1 gap-1.5 font-normal"
                      >
                        #{tag.name}
                        <button
                          type="button"
                          onClick={() => removeTag(tag.id)}
                          className="rounded-full p-0.5 hover:bg-stone-200 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Tag picker + create */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    onValueChange={(value) => {
                      const tag = availableTags.find((t) => t.id === value);
                      if (tag) addTag(tag);
                    }}
                    disabled={isLoadingTags}
                  >
                    <SelectTrigger className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg">
                      <SelectValue
                        placeholder={
                          isLoadingTags
                            ? "Loading tags..."
                            : "Select existing tags..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="border-stone-200 rounded-lg">
                      {availableTags
                        .filter((t) => !selectedTags.some((s) => s.id === t.id))
                        .map((tag) => (
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createAndAddNewTag();
                        }
                      }}
                      className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20 rounded-lg min-w-[160px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={createAndAddNewTag}
                      disabled={!newTagInput.trim() || isCreatingTag}
                      className="border-stone-200 shrink-0"
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
                  className="text-sm font-medium text-stone-700"
                >
                  Content <span className="text-[#F36509]">*</span>
                </Label>
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <LazyTiptapEditor
                    value={formData.content}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, content: value }))
                    }
                    placeholder="Write your post content here..."
                  />
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-6 sm:px-8 py-5 border-t border-stone-100 bg-stone-50/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-stone-200 text-stone-600 hover:bg-white hover:text-stone-900 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.title.trim()}
                className="bg-[#F36509] hover:bg-[#d95508] text-white rounded-lg shadow-sm"
              >
                {isLoading ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
