"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, LogOut, Loader2 } from "lucide-react";

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

export function UserMenu({
  name = "Juan Dela Cruz",
  email = "juan@ihubdavao.com",
  avatarUrl,
  initials = "JD",
}: {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  initials?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutUser();
      if (result.success) {
        toast.success("Logged out");
        // Full navigation so cookies/session clear cleanly
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
