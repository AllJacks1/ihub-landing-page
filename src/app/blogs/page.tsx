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
  Search,
  ArrowRight,
  BookOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import LoginModal from "@/components/sections/LoginModal";
import { getCategories, getPosts } from "@/lib/actions";
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: string | null;
  parent_name?: string | null;
}

function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/blogs/${post.slug}`)}
      className="group cursor-pointer overflow-hidden border-stone-200 bg-white pt-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5"
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

      <CardContent className="p-5 sm:p-6">
        {post.category_name && (
          <Badge
            variant="outline"
            className="mb-3 border-[#F36509]/30 text-xs text-[#F36509] hover:bg-[#F36509]/5"
          >
            {post.category_name}
          </Badge>
        )}

        <h2 className="mb-2 font-serif text-xl font-semibold leading-tight text-stone-900 transition-colors group-hover:text-[#F36509] sm:mb-3 sm:text-2xl">
          {post.title}
        </h2>

        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-stone-500 sm:mb-5">
          {post.summary}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <Calendar className="h-4 w-4 shrink-0 text-[#F36509]" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Draft"}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="border-none bg-stone-100 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/blogs/tag/${tag.slug}`}>#{tag.name}</Link>
                </Badge>
              ))}
              {post.tags.length > 3 && (
                <Badge
                  variant="secondary"
                  className="border-none bg-stone-100 text-xs font-medium text-stone-500"
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
      <CardContent className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-16 w-full" />
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [postsResult, categoriesResult] = await Promise.all([
          getPosts(),
          getCategories(),
        ]);

        if (postsResult.success) setPosts(postsResult.data);
        if (categoriesResult.success) setCategories(categoriesResult.data);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-white px-4 py-16 text-center sm:px-6 sm:py-20 md:py-28">
        <div className="pointer-events-none absolute -left-40 -top-40 h-72 w-72 rounded-full bg-orange-50 blur-3xl sm:h-96 sm:w-96" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-amber-50 blur-3xl sm:h-80 sm:w-80" />

        <div className="relative mx-auto max-w-3xl">
          <Badge
            variant="outline"
            className="mb-4 border-stone-300 px-3 py-1 text-xs font-bold tracking-widest text-stone-500 sm:mb-6 sm:px-4 sm:py-1.5"
          >
            BLOG
          </Badge>

          <h1 className="mb-4 font-serif text-4xl font-semibold tracking-tighter text-stone-900 sm:text-5xl md:text-6xl lg:text-7xl">
            iHub Insights
          </h1>

          <p className="mx-auto max-w-2xl text-base leading-relaxed text-stone-500 sm:text-lg md:text-xl">
            Stories, tips, and updates from the iHub community — productivity,
            entrepreneurship, and Davao&apos;s creative scene.
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      {/* ===== MAIN CONTENT ===== */}
      <section className="px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        <div className="mx-auto flex max-w-7xl gap-8 lg:gap-10">
          {/* Left Column */}
          <div className="min-w-0 flex-1">
            {/* Search & Header */}
            <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="relative w-full max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 rounded-full border-stone-200 bg-white pl-12 pr-5 text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-[#F36509] focus:ring-[#F36509] sm:h-14"
                />
              </div>

              <div className="shrink-0">
                <LoginModal />
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center sm:py-20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 sm:h-16 sm:w-16">
                  <BookOpen className="h-7 w-7 text-stone-400 sm:h-8 sm:w-8" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-stone-900 sm:text-lg">
                  No articles found
                </h3>
                <p className="text-sm text-stone-500 sm:text-base">
                  Try adjusting your search terms or browse all articles.
                </p>
              </div>
            ) : (
              <>
                {/* Featured Post */}
                {featuredPost && !searchTerm && (
                  <div className="mb-8 sm:mb-10">
                    <Card
                      onClick={() => router.push(`/blogs/${featuredPost.slug}`)}
                      className="group cursor-pointer overflow-hidden border-stone-200 bg-white pt-0 pb-0 transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/5"
                    >
                      <div className="grid md:grid-cols-2">
                        {featuredPost.featured_image && (
                          <div className="relative aspect-4/3 overflow-hidden bg-stone-200 md:aspect-auto md:min-h-80">
                            <Image
                              src={featuredPost.featured_image}
                              alt={featuredPost.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        )}
                        <CardContent className="flex flex-col justify-center p-6 sm:p-8 md:p-10 lg:p-12">
                          {featuredPost.category_name && (
                            <Badge className="mb-4 w-fit bg-linear-to-r from-[#F36509] to-orange-500 text-white shadow-sm transition-all duration-300 hover:from-orange-600 hover:to-[#F36509] sm:mb-6">
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                              {featuredPost.category_name}
                            </Badge>
                          )}

                          <h2 className="mb-4 font-serif text-2xl font-semibold leading-[1.15] tracking-tight text-stone-900 transition-colors duration-300 group-hover:text-[#F36509] sm:mb-5 sm:text-3xl md:text-4xl lg:text-[2.5rem]">
                            {featuredPost.title}
                          </h2>

                          <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-stone-500 sm:mb-8 sm:text-base md:text-lg">
                            {featuredPost.summary}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-stone-100 pt-5 text-sm font-medium text-stone-400 sm:pt-6">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-[#F36509]" />
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
                          </div>

                          {featuredPost.tags &&
                            featuredPost.tags.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2 sm:mt-6">
                                {featuredPost.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="cursor-pointer border border-stone-200/60 bg-stone-50 text-xs font-medium text-stone-600 transition-all duration-200 hover:bg-[#F36509] hover:text-white"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Link href={`/blogs/tag/${tag.slug}`}>
                                      #{tag.name}
                                    </Link>
                                  </Badge>
                                ))}
                                {featuredPost.tags.length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="cursor-default border border-stone-200/60 bg-stone-50 text-xs font-medium text-stone-400"
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
                <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                  {(searchTerm ? filteredPosts : remainingPosts).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ===== SIDEBAR (desktop only) ===== */}
          <aside className="hidden w-72 shrink-0 lg:block xl:w-80">
            <div className="sticky top-28 space-y-6 xl:space-y-8">
              {/* Categories */}
              <Card className="border-stone-200 bg-white shadow-sm">
                <CardContent className="p-5 xl:p-6">
                  <h3 className="mb-4 font-semibold text-stone-900">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {categories.length > 0
                      ? categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSearchTerm(cat.name)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#F36509] xl:px-4 xl:py-3"
                          >
                            <span>{cat.name}</span>
                            <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                          </button>
                        ))
                      : [
                          "Productivity",
                          "Community",
                          "Lifestyle",
                          "Events",
                          "Tips",
                        ].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSearchTerm(cat)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-50 hover:text-[#F36509] xl:px-4 xl:py-3"
                          >
                            <span>{cat}</span>
                          </button>
                        ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              {/* <Card className="border-stone-200 bg-white shadow-sm">
                <CardContent className="p-5 xl:p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F36509]/10 xl:h-12 xl:w-12">
                    <Sparkles className="h-5 w-5 text-[#F36509] xl:h-6 xl:w-6" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-semibold text-stone-900 xl:text-xl">
                    Stay Updated
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-stone-500 xl:mb-5">
                    Get the latest stories and tips delivered to your inbox.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-11 rounded-full border-stone-200 bg-stone-50 px-4 text-sm focus:border-[#F36509] focus:ring-[#F36509] xl:h-12"
                    />
                    <Button
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-full bg-[#F36509] text-white hover:bg-[#e05a00] xl:h-12 xl:w-12"
                    >
                      <ArrowRight className="h-4 w-4 xl:h-5 xl:w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </aside>
        </div>
      </section>

      {/* ===== BOTTOM TAGLINE ===== */}
      <section className="bg-white px-4 py-12 text-center sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-xl italic tracking-tight text-stone-400 sm:text-2xl">
            Create your future. Celebrate your now.
          </p>
        </div>
      </section>
    </main>
  );
}
