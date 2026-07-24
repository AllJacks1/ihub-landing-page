"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  FileText,
  Users,
  Tag,
  FolderTree,
  MessageSquare,
  BarChart3,
  Settings,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock,
  CheckCircle2,
  MoreHorizontal,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import CreatePostModal from "@/components/sections/CreatePostModal";
import { toast } from "sonner";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { id: "posts", label: "All Posts", icon: FileText, href: "/admin/posts" },
  { id: "new", label: "New Post", icon: Plus, href: "/admin/posts/new" },
  {
    id: "categories",
    label: "Categories",
    icon: FolderTree,
    href: "/admin/categories",
  },
  { id: "tags", label: "Tags", icon: Tag, href: "/admin/tags" },
  {
    id: "comments",
    label: "Comments",
    icon: MessageSquare,
    href: "/admin/comments",
    badge: "3",
  },
  { id: "authors", label: "Authors", icon: Users, href: "/admin/authors" },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

const stats = [
  {
    title: "Total Posts",
    value: "42",
    change: "+8",
    trend: "up",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
  },
  {
    title: "Published",
    value: "31",
    change: "+3",
    trend: "up",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Drafts",
    value: "8",
    change: "+2",
    trend: "up",
    icon: Clock,
    color: "bg-amber-50 text-amber-600",
  },
  {
    title: "Comments",
    value: "127",
    change: "-5",
    trend: "down",
    icon: MessageSquare,
    color: "bg-rose-50 text-rose-600",
  },
];

const recentPosts = [
  {
    id: "1",
    title: "How to Stay Productive in a Coworking Space",
    status: "published",
    views: "1,234",
    date: "Jul 15, 2026",
    author: "Juan Dela Cruz",
  },
  {
    id: "2",
    title: "The Rise of Remote Work in Davao City",
    status: "published",
    views: "892",
    date: "Jul 10, 2026",
    author: "Maria Santos",
  },
  {
    id: "3",
    title: "Coffee Culture: Why Your Morning Brew Matters",
    status: "draft",
    views: "-",
    date: "Jul 5, 2026",
    author: "Juan Dela Cruz",
  },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <main className="flex-1 p-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="overview" className="mt-0 space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="font-serif text-4xl font-semibold tracking-tighter text-stone-900">
              Dashboard Overview
            </h1>
            <p className="mt-2 text-stone-500">
              Welcome back! Here&apos;s what&apos;s happening with your blog.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                className="border-stone-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-500">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-4xl font-bold text-stone-900">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}
                    >
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-sm">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={
                        stat.trend === "up"
                          ? "font-medium text-emerald-600"
                          : "font-medium text-red-600"
                      }
                    >
                      {stat.change}
                    </span>
                    <span className="text-stone-400">this month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Posts + Quick Actions */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Recent Posts */}
            <Card className="border-stone-200 bg-white shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="font-serif text-xl font-semibold text-stone-900">
                    Recent Posts
                  </CardTitle>
                  <p className="text-sm text-stone-500">
                    Your latest blog activity
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="h-9 rounded-full text-[#F36509] hover:bg-[#F36509]/5"
                >
                  <Link href="/admin/posts">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/50 p-4 transition-colors hover:bg-stone-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-medium text-stone-900">
                            {post.title}
                          </h3>
                          <Badge
                            variant={
                              post.status === "published"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              post.status === "published"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                            }
                          >
                            {post.status}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-stone-500">
                          <span>{post.author}</span>
                          <span>•</span>
                          <span>{post.date}</span>
                          {post.views !== "-" && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.views} views
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-stone-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="font-serif text-xl font-semibold text-stone-900">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QuickActionButton
                  icon={Plus}
                  label="Write New Post"
                  description="Create a fresh article"
                  href="/admin/posts/new"
                />
                <QuickActionButton
                  icon={FolderTree}
                  label="Manage Categories"
                  description="Organize your content"
                  href="/admin/categories"
                />
                <QuickActionButton
                  icon={Tag}
                  label="Edit Tags"
                  description="Update post tags"
                  href="/admin/tags"
                />
                <QuickActionButton
                  icon={MessageSquare}
                  label="Moderate Comments"
                  description="3 pending reviews"
                  href="/admin/comments"
                  badge="3"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

// Quick Action Button
function QuickActionButton({
  icon: Icon,
  label,
  description,
  href,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-stone-100 bg-stone-50/50 p-4 transition-all hover:border-[#F36509]/20 hover:bg-[#F36509]/5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
        <Icon className="h-5 w-5 text-[#F36509]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-stone-900">{label}</p>
          {badge && (
            <Badge className="h-5 bg-[#F36509] px-1.5 text-[10px] text-white hover:bg-[#F36509]">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-stone-400 transition-colors group-hover:text-[#F36509]" />
    </Link>
  );
}
