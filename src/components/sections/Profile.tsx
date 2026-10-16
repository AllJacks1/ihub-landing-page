"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown, LogOut, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutUser } from "@/lib/actions";

type UserRole = "cashier" | "management" | "partner" | "crew";

export function UserMenu({
  name = "Juan Dela Cruz",
  email = "juan@ihubdavao.com",
  avatarUrl,
  initials = "JD",
  role = "crew",
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  initials?: string;
  role?: UserRole;
}) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutUser();
      if (result.success) {
        // Extra safety on the client
        Cookies.remove("adminId");
        // Cookies.remove("userId");

        toast.success("Logged out");
        window.location.href = "/";
      } else {
        toast.error(result.error || "Failed to log out");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full pr-3 pl-2 text-stone-700 transition-all duration-200 ease-out outline-none select-none hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-[#F36509]/30 focus-visible:ring-offset-2 active:scale-[0.98]">
        <Avatar className="h-7 w-7">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
          <AvatarFallback className="bg-[#F36509]/10 text-xs font-bold text-[#F36509]">
            {initials}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-stone-900">{name}</span>
              <span className="text-xs font-normal text-stone-500">
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <span className="text-xs font-medium text-stone-600">Role</span>
          <span className="ml-auto font-semibold text-stone-900">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                role === "management"
                  ? "bg-[#F36509]/10 text-[#F36509]"
                  : role === "cashier"
                    ? "bg-blue-50 text-blue-700"
                    : role === "partner"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-stone-100 text-stone-600"
              }`}
            >
              {role}
            </span>
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={handleLogout}
          className="cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          {isPending ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
