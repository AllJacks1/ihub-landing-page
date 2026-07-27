"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { Calendar, Search, BookOpen, ArrowRight } from "lucide-react";

import LoginModal from "@/components/sections/LoginModal";
import { getPostsByCategory, getCategories } from "@/lib/actions";

type Tag = {
  id: number;
  name: string;
  slug: string;
};

type Post = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  featured_image: string | null;
  published_at: string | null;
  author_name: string | null;
  category_name: string | null;
  tags: Tag[];       
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
      className="overflow-hidden border-stone-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer"
    >
      {post.featured_image && (
        <div className="relative aspect-16/10 overflow-hidden bg-stone-200">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover transition-transform hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      <CardContent className="p-6">
        {post.category_name && (
          <Badge
            variant="outline"
            className="mb-3 border-[#F36509]/30 text-[#F36509]"
          >
            {post.category_name}
          </Badge>
        )}

        <h2 className="mb-3 font-serif text-2xl font-semibold leading-tight hover:text-[#F36509]">
          {post.title}
        </h2>

        <p className="mb-5 line-clamp-3 text-sm text-stone-500">
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
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                >
                  <Link href={`/blogs/tag/${tag.slug}`}>
                    #{tag.name}
                  </Link>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [categoryName, setCategoryName] = useState<string>(slug || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        const [postsRes, catsRes] = await Promise.all([
          getPostsByCategory(slug as string),
          getCategories(),
        ]);

        if (postsRes.success) {
          setPosts(postsRes.data);
          setCategoryName(postsRes.categoryName || slug);
        }
        if (catsRes.success) setCategories(catsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="relative bg-white px-6 py-28 text-center">
        <div className="mx-auto max-w-3xl">
          <Badge variant="outline" className="mb-6">CATEGORY</Badge>
          <h1 className="font-serif text-6xl font-semibold tracking-tighter text-stone-900">
            {categoryName}
          </h1>
          <p className="mt-4 text-xl text-stone-500">
            All posts in this category
          </p>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl bg-stone-200" />

      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-7xl gap-10">
          <div className="flex-1">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <Input
                  placeholder="Search in this category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-14 rounded-full border-stone-200 pl-12"
                />
              </div>
              <LoginModal />
            </div>

            {loading ? (
              <div className="grid gap-8 md:grid-cols-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-96" />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-20 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-stone-400" />
                <h3 className="mt-4 text-lg font-semibold">No posts found</h3>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2">
                {filteredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden w-80 lg:block">
            {/* Paste your Categories sidebar here */}
          </aside>
        </div>
      </section>
    </main>
  );
}