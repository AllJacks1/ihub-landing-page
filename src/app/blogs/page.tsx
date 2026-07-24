"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Tag,
  Search,
  ArrowRight,
  BookOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import LoginModal from "@/components/sections/LoginModal";
import { getPosts } from "@/lib/actions";
import { useRouter } from "next/navigation";

type Tag = {
  id: string;
  slug: string;
  name: string;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  featured_image?: string | null;
  published_at?: string;
  author_name?: string;
  category_name?: string;
  tags?: Tag[] | null;
};

function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/blogs/${post.slug}`)}
      className="overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 pt-0"
    >
      {post.featured_image && (
        <div className="relative aspect-16/10 overflow-hidden bg-stone-200">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone-900/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      )}

      <CardContent className="p-6">
        {post.category_name && (
          <Badge
            variant="outline"
            className="mb-3 border-[#F36509]/30 text-[#F36509] hover:bg-[#F36509]/5"
          >
            {post.category_name}
          </Badge>
        )}

        <h2 className="mb-3 font-serif text-2xl font-semibold leading-tight text-stone-900 transition-colors group-hover:text-[#F36509]">
          {post.title}
        </h2>

        <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-stone-500">
          {post.summary}
        </p>

        <div className="flex items-center justify-between text-sm text-stone-400">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#F36509]" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Draft"}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-600 border-none transition-colors"
                >
                  <Link href={`/blogs/tag/${tag.slug}`}>
                    <span>#{tag.name}</span>
                  </Link>
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs font-medium bg-stone-100 text-stone-500 border-none"
                >
                  +{post.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PostSkeleton() {
  return (
    <Card className="overflow-hidden border-stone-200 bg-white pt-0">
      <Skeleton className="aspect-16/10 w-full" />
      <CardContent className="p-6 space-y-4 ">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlogsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadPosts() {
      try {
        const result = await getPosts();

        if (result.success) {
          setPosts(result.data);
        } else {
          console.error("Failed to fetch posts:", result.error);
          setPosts([]); // fallback
        }
      } catch (error) {
        console.error("Error loading posts:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  console.log(JSON.stringify(posts));

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-6 py-28 text-center">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-orange-50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-50 blur-3xl" />

        <div className="relative mx-auto max-w-3xl">
          <Badge
            variant="outline"
            className="mb-6 border-stone-300 px-4 py-1.5 text-xs font-bold tracking-widest text-stone-500"
          >
            BLOG
          </Badge>

          <h1 className="mb-6 font-serif text-6xl font-semibold tracking-tighter text-stone-900 md:text-7xl">
            iHub Insights
          </h1>

          <p className="mx-auto max-w-2xl text-xl leading-relaxed text-stone-500">
            Stories, tips, and updates from the iHub community — productivity,
            entrepreneurship, and Davao&apos;s creative scene.
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* Main Content */}
      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-7xl gap-10">
          {/* Left Column */}
          <div className="flex-1">
            {/* Search & Header */}
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 rounded-full border-stone-200 bg-white pl-12 pr-6 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509]"
                />
              </div>

              <LoginModal />
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid gap-8 md:grid-cols-2">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                  <BookOpen className="h-8 w-8 text-stone-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-stone-900">
                  No articles found
                </h3>
                <p className="text-stone-500">
                  Try adjusting your search terms or browse all articles.
                </p>
              </div>
            ) : (
              <>
                {/* Featured Post */}
                {featuredPost && !searchTerm && (
                  <div className="mb-10">
                    <Card
                      onClick={() => router.push(`/blogs/${featuredPost.slug}`)}
                      className="overflow-hidden border-stone-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/5 pt-0 pb-0"
                    >
                      <div className="grid md:grid-cols-2">
                        {featuredPost.featured_image && (
                          <div className="relative aspect-4/3 overflow-hidden bg-stone-200 md:aspect-auto">
                            <Image
                              src={featuredPost.featured_image}
                              alt={featuredPost.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        <CardContent className="flex flex-col justify-center p-8 md:p-10 lg:p-12">
                          {/* Category Badge */}
                          {featuredPost.category_name && (
                            <Badge className="mb-6 w-fit bg-linear-to-r from-[#F36509] to-orange-500 text-white shadow-sm hover:from-orange-600 hover:to-[#F36509] transition-all duration-300">
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
                              {featuredPost.category_name}
                            </Badge>
                          )}

                          {/* Title */}
                          <h2 className="mb-5 font-serif text-3xl font-semibold leading-[1.15] tracking-tight text-stone-900 transition-colors duration-300 group-hover:text-[#F36509] md:text-4xl lg:text-[2.5rem]">
                            {featuredPost.title}
                          </h2>

                          {/* Summary */}
                          <p className="mb-8 leading-relaxed text-stone-500 line-clamp-3 text-base md:text-lg">
                            {featuredPost.summary}
                          </p>

                          {/* Metadata Row */}
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-stone-400 border-t border-stone-100 pt-6">
                            <div className="flex items-center gap-2 group/date">
                              <Calendar className="h-4 w-4 text-[#F36509] transition-transform group-hover/date:scale-110" />
                              <span>
                                {featuredPost.published_at
                                  ? new Date(
                                      featuredPost.published_at,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                  : "Draft"}
                              </span>
                            </div>

                            {/* Optional: Add a read time or author here if available */}
                            {/* <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-[#F36509]" />
      <span>5 min read</span>
    </div> */}
                          </div>

                          {/* Tags Section - Moved outside the metadata flex row */}
                          {featuredPost.tags &&
                            featuredPost.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-6">
                                {featuredPost.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="text-xs font-medium bg-stone-50 hover:bg-[#F36509] hover:text-white text-stone-600 border border-stone-200/60 transition-all duration-200 cursor-pointer"
                                  >
                                    <Link
                                      href={`/blogs/tag/${tag.slug}`}
                                      className="flex items-center"
                                    >
                                      <span>#{tag.name}</span>
                                    </Link>
                                  </Badge>
                                ))}
                                {featuredPost.tags.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs font-medium bg-stone-50 text-stone-400 border border-stone-200/60 cursor-default"
                                  >
                                    +{featuredPost.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                        </CardContent>
                      </div>
                    </Card>
                  </div>
                )}

                {/* Post Grid */}
                <div className="grid gap-8 md:grid-cols-2">
                  {(searchTerm ? filteredPosts : remainingPosts).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden w-80 lg:block">
            <div className="sticky top-28 space-y-8">
              {/* Categories */}
              <Card className="border-stone-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <h3 className="mb-4 font-semibold text-stone-900">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {[
                      "Productivity",
                      "Community",
                      "Lifestyle",
                      "Events",
                      "Tips",
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSearchTerm(cat)}
                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#F36509]"
                      >
                        {cat}
                        <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card className="border-stone-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F36509]/10">
                    <Sparkles className="h-6 w-6 text-[#F36509]" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold text-stone-900">
                    Stay Updated
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-stone-500">
                    Get the latest stories and tips delivered to your inbox.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-12 rounded-full border-stone-200 bg-stone-50 px-4 text-sm focus:border-[#F36509] focus:ring-[#F36509]"
                    />
                    <Button
                      size="icon"
                      className="h-12 w-12 shrink-0 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00]"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom Tagline */}
      <section className="bg-white px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-2xl italic tracking-tight text-stone-400">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>
    </main>
  );
}
