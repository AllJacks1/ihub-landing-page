"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ArrowUpDown,
  Tag as TagIcon,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getTags } from "@/lib/actions";

interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const result = await getTags();
      if (result.success) {
        setTags(result.data);
      } else {
        toast.error(result.error || "Failed to load tags");
        setTags([]);
      }
    } catch (error) {
      toast.error("Something went wrong while loading tags");
      setTags([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Tags
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage tags used across your blog posts
          </p>
        </div>

        {/* You can add a "New Tag" button here later */}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Tags
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {tags.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Used in Posts
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {tags.filter((t) => t.post_count > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Search tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20 focus-visible:ring-[#F36509]/20 focus-visible:ring-offset-0"
        />
      </div>

      {/* Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading tags...
              </span>
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
                <TagIcon className="h-7 w-7 text-stone-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-900">
                {searchQuery ? "No matching tags" : "No tags yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Tags will appear here once you start using them"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      <button className="inline-flex items-center gap-1 hover:text-stone-700 transition-colors">
                        Tag Name
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Slug
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Post Count
                    </th>
                    <th className="py-3.5 pr-6 pl-4 text-right font-medium text-stone-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredTags.map((tag) => (
                    <tr
                      key={tag.id}
                      className="group transition-colors hover:bg-stone-50/80"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F36509]/10">
                            <TagIcon className="h-4 w-4 text-[#F36509]" />
                          </div>
                          <span className="font-medium text-stone-900">
                            #{tag.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <code className="rounded-md bg-stone-100 px-2 py-1 text-xs font-mono text-stone-600">
                          {tag.slug}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="bg-stone-100 text-stone-700 font-normal"
                        >
                          {tag.post_count} posts
                        </Badge>
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-500 hover:text-[#F36509] hover:bg-[#F36509]/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-stone-500 hover:text-red-600 hover:bg-red-50"
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
    </main>
  );
}
