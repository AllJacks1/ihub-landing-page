import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPostBySlug } from "@/lib/actions";
import { Calendar, User, Clock, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ slug: string }>;
}

interface Tag {
  id: string | number;
  name: string;
  slug: string;
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPostBySlug(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const post = result.data;

  const readingTime = Math.ceil(
    (post.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0) / 200,
  );

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Breadcrumb */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-stone-500">
            <Link
              href="/blogs"
              className="hover:text-stone-900 transition-colors"
            >
              Blog
            </Link>
            <span className="text-stone-300">/</span>
            {post.category_name && (
              <>
                <span className="text-stone-900">{post.category_name}</span>
                <span className="text-stone-300">/</span>
              </>
            )}
            <span className="text-stone-400 truncate max-w-50">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      {post.featured_image ? (
        <div className="relative h-[50vh] min-h-95 max-h-150 w-full">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-black/10" />

          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto max-w-3xl px-6 pb-10 pt-32">
              {post.category_name && (
                <span className="mb-4 inline-block rounded-full bg-[#F36509] px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  {post.category_name}
                </span>
              )}
              <h1 className="font-serif text-3xl font-bold leading-tight text-white md:text-5xl text-shadow">
                {post.title}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-b border-stone-200">
          <div className="mx-auto max-w-3xl px-6 py-16">
            {post.category_name && (
              <span className="mb-4 inline-block rounded-full bg-[#F36509]/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-[#F36509]">
                {post.category_name}
              </span>
            )}
            <h1 className="font-serif text-4xl font-bold leading-tight text-stone-900 md:text-5xl">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`mx-auto max-w-3xl px-6 ${post.featured_image ? "-mt-6" : ""} relative z-10`}
      >
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-stone-200 md:p-12">
          {/* Meta bar */}
          <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stone-100 pb-8 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100">
                <User className="h-4 w-4 text-stone-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-stone-900">
                  {post.author_name}
                </span>
                <span className="text-xs">Author</span>
              </div>
            </div>

            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-stone-400" />
                <time dateTime={post.published_at}>
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-stone-400" />
              <span>{readingTime} min read</span>
            </div>

            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-stone-500 hover:text-stone-900"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {/* Article body */}
          <article
            className="prose prose-stone max-w-none 
              prose-headings:font-serif prose-headings:font-semibold prose-headings:text-stone-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-stone-600 prose-p:leading-relaxed
              prose-a:text-[#F36509] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-stone-900
              prose-blockquote:border-l-[#F36509] prose-blockquote:bg-stone-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-img:rounded-xl prose-img:shadow-md
              prose-pre:bg-stone-900 prose-pre:text-stone-50"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-8 border-t border-stone-100">
              <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: Tag) => (
                  <Link
                    key={tag.id}
                    href={`/blogs/tag/${tag.slug}`}
                    className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-[#F36509] hover:text-white"
                  >
                    <span>#{tag.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="mt-10 mb-16 flex items-center justify-between">
          <Button
            variant="ghost"
            className="gap-2 text-stone-500 hover:text-stone-900"
          >
            <Link href="/blogs">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
