import type { ReactNode } from "react";
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
import CreatePostModal from "@/components/sections/CreatePostModal";
import {
  Settings,
  Eye,
  LogOut,
  ChevronDown,
  Bell,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import AdminSidebar from "@/components/sections/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#F36509] ring-2 ring-white" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div
                  role="button"
                  tabIndex={0}
                  className="inline-flex items-center h-10 gap-2 rounded-full pl-2 pr-3 text-stone-700 cursor-pointer select-none transition-all duration-200 ease-out hover:bg-stone-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36509]/30 focus-visible:ring-offset-2"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src="/images/avatar.jpg" />
                    <AvatarFallback className="bg-[#F36509]/10 text-xs font-bold text-[#F36509]">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold">Juan Dela Cruz</span>
                    <span className="text-xs text-stone-500">
                      juan@ihubdavao.com
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
