"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Edit2,
  Trash2,
  Search,
  MessageSquare,
  MessageCircle,
  Reply,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { approveComment, deleteComment, getAllComments } from "@/lib/actions";

interface Comment {
  id: string;
  content: string;
  author_name: string | null;
  author_email: string | null;
  user_id?: string | null;
  parent_id?: string | null;
  status: string;
  created_at: string;
  post_id: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const result = await getAllComments();

      if (result.success) {
        // Normalize the data so `post` is always a single object or null
        const normalized = (result.data ?? []).map((c: any) => ({
          ...c,
          post: Array.isArray(c.post) ? (c.post[0] ?? null) : (c.post ?? null),
        }));

        setComments(normalized);
      } else {
        toast.error(result.error || "Failed to load comments");
      }
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filteredComments = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return comments.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        c.author_name.toLowerCase().includes(q) ||
        c.author_email.toLowerCase().includes(q) ||
        c.post?.title?.toLowerCase().includes(q) ||
        c.post?.slug?.toLowerCase().includes(q),
    );
  }, [comments, searchQuery]);

  const parentComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments],
  );

  const replyComments = useMemo(
    () => comments.filter((c) => !!c.parent_id),
    [comments],
  );

  const approvedCount = useMemo(
    () => comments.filter((c) => c.status === "approved").length,
    [comments],
  );

  const pendingCount = useMemo(
    () => comments.filter((c) => c.status === "pending").length,
    [comments],
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Comments
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Moderate all comments across your blog
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchComments}
          className="border-stone-200"
        >
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total Comments
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {comments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Top-level
            </p>
            <p className="mt-1 text-3xl font-semibold text-[#F36509]">
              {parentComments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Replies
            </p>
            <p className="mt-1 text-3xl font-semibold text-green-600">
              {replyComments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Pending
            </p>
            <p className="mt-1 text-3xl font-semibold text-amber-600">
              {pendingCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Search content, author, email or post..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
        />
      </div>

      {/* Comments Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading comments...
              </span>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-10 w-10 text-stone-300 mb-3" />
              <p className="text-sm font-medium text-stone-900">
                {searchQuery ? "No matching comments" : "No comments yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Comments will appear here once people start discussing"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Author
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Comment
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Post
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Type
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Status
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Date
                    </th>
                    <th className="py-3.5 pr-6 pl-4 text-right font-medium text-stone-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredComments.map((comment) => (
                    <tr
                      key={comment.id}
                      className="group hover:bg-stone-50/80 transition-colors"
                    >
                      {/* Author */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-[#F36509]/10 p-2">
                            {comment.parent_id ? (
                              <Reply className="h-4 w-4 text-[#F36509]" />
                            ) : (
                              <MessageCircle className="h-4 w-4 text-[#F36509]" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">
                              {comment.author_name}
                            </div>
                            <div className="text-xs text-stone-500 mt-0.5">
                              {comment.author_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Content */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-sm text-stone-700 line-clamp-2">
                          {comment.content}
                        </p>
                      </td>

                      {/* Post */}
                      <td className="py-4 px-4">
                        {comment.post ? (
                          <a
                            href={`/blog/${comment.post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-stone-700 hover:text-[#F36509] transition-colors"
                          >
                            <span className="line-clamp-1 max-w-[140px]">
                              {comment.post.title}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-stone-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        {comment.parent_id ? (
                          <Badge
                            variant="outline"
                            className="font-normal text-stone-600"
                          >
                            Reply
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            Top-level
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {comment.status === "approved" ? (
                          <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : comment.status === "pending" ? (
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-stone-600">
                            {comment.status}
                          </Badge>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-stone-500 text-xs whitespace-nowrap">
                        {formatDate(comment.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Approve (only show when pending) */}
                          {comment.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:bg-green-50"
                              onClick={async () => {
                                const res = await approveComment(comment.id);
                                if (res.success) {
                                  toast.success("Comment approved");
                                  fetchComments();
                                } else {
                                  toast.error(res.error);
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Edit – open a modal or inline form */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              // open your edit modal here
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Are you sure you want to delete this comment?",
                                )
                              )
                                return;

                              const res = await deleteComment(comment.id);
                              if (res.success) {
                                toast.success("Comment deleted");
                                fetchComments();
                              } else {
                                toast.error(res.error);
                              }
                            }}
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
