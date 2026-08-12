"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FileText,
  Tag,
  FolderTree,
  MessageSquare,
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  BetweenHorizontalStart,
} from "lucide-react";

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
};

type SidebarGroup = {
  id: string;
  label: string;
  items: SidebarItem[];
};

const sidebarGroups: SidebarGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "overview",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/admin",
      },
      //{
      //   id: "settings",
      //   label: "Settings",
      //   icon: Settings,
      //   href: "/admin/settings",
      // },
    ],
  },
  {
    id: "blogs",
    label: "Blogs",
    items: [
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
    ],
  },
  {
    id: "reservations",
    label: "Reservations",
    items: [
      {
        id: "reservations",
        label: "All Reservations",
        icon: CalendarCheck,
        href: "/admin/reservations",
      },
      {
        id: "new-reservation",
        label: "New Reservation",
        icon: Plus,
        href: "/admin/reservations/new",
      },
      {
        id: "spaces",
        label: "Tables",
        icon: BetweenHorizontalStart,
        href: "/admin/spaces",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: CalendarDays,
        href: "/admin/reservations/calendar",
      },
    ],
  },
];

function AdminSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      overview: true,
      blogs: true,
      reservations: true,
    },
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] border-r border-stone-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col p-3">
        <nav className="flex-1 space-y-4">
          {sidebarGroups.map((group) => (
            <div key={group.id}>
              {!sidebarCollapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400 transition-colors hover:text-stone-600"
                >
                  {expandedGroups[group.id] ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {group.label}
                </button>
              )}

              <div
                className={`space-y-0.5 ${
                  sidebarCollapsed
                    ? "block"
                    : expandedGroups[group.id]
                      ? "block"
                      : "hidden"
                }`}
              >
                {group.items.map((item) => (
                  <SidebarLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    badge={item.badge}
                    collapsed={sidebarCollapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mt-auto w-full justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          {sidebarCollapsed ? "→" : "← Collapse"}
        </Button>
      </div>
    </aside>
  );
}

function SidebarLink({
  icon: Icon,
  label,
  href,
  badge,
  collapsed,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
        isActive
          ? "bg-[#F36509]/10 font-medium text-[#F36509]"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-sm">{label}</span>
          {badge && (
            <Badge className="h-5 min-w-5 bg-[#F36509] px-1.5 text-[10px] text-white hover:bg-[#F36509]">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}

export default AdminSidebar;
