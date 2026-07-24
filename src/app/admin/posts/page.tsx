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
} from "lucide-react";
import { toast } from "sonner";
import CreatePostModal from "@/components/sections/CreatePostModal";
import { getPosts } from "@/lib/actions";

interface Post {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  status: "draft" | "published" | "archived";
  published_at?: string;
  created_at: string;
  author_name: string;
  category_name?: string;
  parent_category_name?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const result = await getPosts();

      if (result.success) {
        setPosts(result.data);
      } else {
        toast.error(result.error || "Failed to load posts");
        setPosts([]);
      }
    } catch (error) {
      toast.error("Something went wrong while loading posts");
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Posts
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage your blog posts
          </p>
        </div>

        <CreatePostModal onPostCreated={fetchPosts} />
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Posts
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {posts.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Published
            </p>
            <p className="mt-1 text-3xl font-semibold text-green-600">
              {posts.filter((p) => p.status === "published").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Drafts
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {posts.filter((p) => p.status === "draft").length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Archived
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {posts.filter((p) => p.status === "archived").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Search posts or authors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
        />
      </div>

      {/* Posts Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading posts...
              </span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-stone-900">
                {searchQuery ? "No matching posts" : "No posts yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first post to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Post
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Category
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Author
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
                  {filteredPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="group hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <div className="font-medium text-stone-900">
                          {post.title}
                        </div>
                        <div className="text-xs text-stone-500 font-mono mt-0.5">
                          /{post.slug}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {post.category_name ? (
                          <Badge variant="secondary" className="font-normal">
                            {post.parent_category_name
                              ? `${post.parent_category_name} > ${post.category_name}`
                              : post.category_name}
                          </Badge>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          {post.author_name}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-stone-500">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
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
