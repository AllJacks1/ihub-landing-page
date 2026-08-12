import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import CreatePostModal from "@/components/sections/CreatePostModal";
import { Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AdminSidebar from "@/components/sections/AdminSidebar";
import { UserMenu } from "@/components/sections/Profile";
import { getCurrentUser } from "@/lib/actions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F36509]">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900">
                iHub Admin
              </h1>
              <p className="text-xs text-stone-500">Blog Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 rounded-full border-stone-300 px-4 text-sm font-medium text-stone-700 hover:border-[#F36509] hover:text-[#F36509]"
            >
              <Link href="/blog" className="inline-flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Blog
              </Link>
            </Button>

            <CreatePostModal />

            <Separator orientation="vertical" className="h-8 bg-stone-200" />

            {/* Notifications */}
            {/* <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#F36509] ring-2 ring-white" />
            </Button> */}

            {/* Profile */}
            <UserMenu
              name={user?.full_name ?? "Admin"}
              email={user?.email ?? ""}
              initials={user?.initials ?? "AD"}
              avatarUrl={user?.avatarUrl}
            />
          </div>
        </div>
      </header>
      <div className="flex">
        <AdminSidebar />
        {children}
      </div>
    </div>
  );
}
