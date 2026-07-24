"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2, Search, Tag as TagIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { getTags } from "@/lib/actions";
import CreateTagModal from "@/components/sections/CreateTagModal";

interface Post {
  id: string;
  title: string;
  slug: string;
  published_at?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  posts: Post[];
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
      }
    } catch (error) {
      toast.error("Failed to load tags");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const filteredTags = useMemo(() => {
    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [tags, searchQuery]);

  const totalPosts = useMemo(
    () => tags.reduce((sum, tag) => sum + (tag.post_count || 0), 0),
    [tags],
  );

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Tags
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">Manage your blog tags</p>
        </div>

        <CreateTagModal onTagCreated={fetchTags} />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              Total Posts
            </p>
            <p className="mt-1 text-3xl font-semibold text-[#F36509]">
              {totalPosts}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Active Tags
            </p>
            <p className="mt-1 text-3xl font-semibold text-green-600">
              {tags.filter((t) => t.post_count > 0).length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Unused Tags
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {tags.filter((t) => t.post_count === 0).length}
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
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
        />
      </div>

      {/* Tags Table */}
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-stone-900">
                {searchQuery ? "No matching tags" : "No tags yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first tag to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Tag
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Slug
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Posts
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Latest Posts
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
                      className="group hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#F36509]/10 p-2">
                            <TagIcon className="h-4 w-4 text-[#F36509]" />
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">
                              #{tag.name}
                            </div>
                            <div className="text-xs text-stone-500 font-mono mt-0.5">
                              /tags/{tag.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="secondary"
                          className="font-normal font-mono"
                        >
                          {tag.slug}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`text-sm font-medium ${
                            tag.post_count > 0
                              ? "text-green-600"
                              : "text-stone-400"
                          }`}
                        >
                          {tag.post_count}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {tag.posts && tag.posts.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {tag.posts.slice(0, 2).map((post) => (
                              <span
                                key={post.id}
                                className="text-xs text-stone-600 line-clamp-1"
                              >
                                {post.title}
                              </span>
                            ))}
                            {tag.posts.length > 2 && (
                              <span className="text-xs text-stone-400">
                                +{tag.posts.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${tag.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${tag.name}`}
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
