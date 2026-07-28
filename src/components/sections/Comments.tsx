"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, Reply, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns"; // or your preferred date lib

interface Comment {
  id: string;
  content: string;
  author_name: string | null;
  author_email: string | null;
  user_id: string | null;
  parent_id: string | null;
  status: string;
  created_at: string;
}

interface CommentsProps {
  postId: string;
  comments: Comment[];
  isLoggedIn: boolean;
}

export function Comments({ postId, comments, isLoggedIn }: CommentsProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Build nested tree
  const roots = comments.filter((c) => !c.parent_id);
  const childrenMap = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = acc[c.parent_id] || [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {});

  async function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createComment(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to post comment");
      } else {
        setReplyTo(null);
        // form will reset via key or you can reset manually
      }
    });
  }

  function CommentItem({
    comment,
    depth = 0,
  }: {
    comment: Comment;
    depth?: number;
  }) {
    const author = comment.author_name || "Anonymous";

    return (
      <div
        className={
          depth > 0 ? "ml-6 mt-4 border-l-2 border-stone-200 pl-4" : "mt-6"
        }
      >
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100">
            <User className="h-4 w-4 text-stone-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-stone-900">{author}</span>
              <span className="text-stone-400">·</span>
              <time className="text-stone-400">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })}
              </time>
            </div>
            <p className="mt-1 text-stone-600 whitespace-pre-wrap">
              {comment.content}
            </p>
            <button
              type="button"
              onClick={() =>
                setReplyTo(replyTo === comment.id ? null : comment.id)
              }
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#F36509]"
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>

            {replyTo === comment.id && (
              <CommentForm
                postId={postId}
                parentId={comment.id}
                isLoggedIn={isLoggedIn}
                onSubmit={handleSubmit}
                isPending={isPending}
                error={error}
                onCancel={() => setReplyTo(null)}
              />
            )}

            {childrenMap[comment.id]?.map((child) => (
              <CommentItem key={child.id} comment={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-12 pt-10 border-t border-stone-100">
      <h2 className="flex items-center gap-2 text-xl font-semibold text-stone-900">
        <MessageSquare className="h-5 w-5 text-[#F36509]" />
        Comments ({comments.length})
      </h2>

      {/* Top-level form */}
      <div className="mt-6">
        <CommentForm
          postId={postId}
          isLoggedIn={isLoggedIn}
          onSubmit={handleSubmit}
          isPending={isPending}
          error={error}
        />
      </div>

      <div className="mt-8">
        {roots.length === 0 ? (
          <p className="text-stone-500 text-sm">
            No comments yet. Be the first!
          </p>
        ) : (
          roots.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>
    </section>
  );
}

function CommentForm({
  postId,
  parentId,
  isLoggedIn,
  onSubmit,
  isPending,
  error,
  onCancel,
}: {
  postId: string;
  parentId?: string | null;
  isLoggedIn: boolean;
  onSubmit: (formData: FormData) => void;
  isPending: boolean;
  error: string | null;
  onCancel?: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}

      {!isLoggedIn && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input name="authorName" placeholder="Your name" required />
          <Input
            name="authorEmail"
            type="email"
            placeholder="Your email"
            required
          />
        </div>
      )}

      <Textarea
        name="content"
        placeholder={parentId ? "Write a reply…" : "Write a comment…"}
        required
        rows={3}
        className="resize-none"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[#F36509] hover:bg-[#e55a00]"
        >
          {isPending ? "Posting…" : parentId ? "Post Reply" : "Post Comment"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
