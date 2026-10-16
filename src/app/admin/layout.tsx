import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import CreatePostModal from "@/components/sections/CreatePostModal";
import { Eye, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AdminSidebar from "@/components/sections/AdminSidebar";
import { UserMenu } from "@/components/sections/Profile";
import { getCurrentUser, requireRole, UserRole } from "@/lib/actions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The layout is the public route boundary for /admin. Auth is verified
  // here (auth cookie + server-side getUser()). Role enforcement moves to
  // per-module guards (e.g. /admin/pos/terminal, /admin/iaccess/users/manage)
  // so that Cashier, Partner, and Crew can reach only their permitted
  // modules. The cookie alone is never treated as a role signal.
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

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
              <p className="text-xs text-stone-500">
                {user.role === "management"
                  ? "Management"
                  : user.role === "cashier"
                    ? "Cashier"
                    : user.role === "partner"
                      ? "Partner"
                      : "Crew / Barista"}
              </p>
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

            {/* Profile */}
            <UserMenu
              name={user.full_name}
              email={user.email}
              initials={user.initials}
              avatarUrl={user.avatarUrl}
              role={user.role}
            />
          </div>
        </div>
      </header>
      <div className="flex">
        <AdminSidebar />
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
