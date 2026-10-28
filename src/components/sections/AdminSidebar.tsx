"use client";

import { useState, useEffect } from "react";
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
  Users,
  Ad,
  Terminal as TerminalIcon,
  PartyPopper,
  Monitor,
  Warehouse,
  ChefHat,
  Coffee,
} from "lucide-react";

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  items?: SidebarSubItem[];
};

type SidebarSubItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  items?: SidebarSubItem[];
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
        href: "/admin/dashboard",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
    items: [
      {
        id: "events",
        label: "Events",
        icon: PartyPopper,
        href: "/admin/events",
      },
    ],
  },
  {
    id: "blogs",
    label: "Blogs",
    items: [
      {
        id: "posts",
        label: "All Posts",
        icon: FileText,
        href: "/admin/posts",
      },
      {
        id: "new",
        label: "New Post",
        icon: Plus,
        href: "/admin/posts/new",
      },
      {
        id: "categories",
        label: "Categories",
        icon: FolderTree,
        href: "/admin/categories",
      },
      {
        id: "tags",
        label: "Tags",
        icon: Tag,
        href: "/admin/tags",
      },
      {
        id: "comments",
        label: "Comments",
        icon: MessageSquare,
        href: "/admin/comments",
      },
    ],
  },
  {
    id: "pos",
    label: "POS",
    items: [
      {
        id: "primary-terminal",
        label: "Primary Terminal",
        icon: Monitor,
        href: "/admin/pos/terminal/primary",
      },
      {
        id: "reservations",
        label: "Reservation Terminal",
        icon: CalendarCheck,
        href: "/admin/pos/terminal/reservation",
      },
      {
        id: "reservation-monitor",
        label: "Reservation Monitor",
        icon: CalendarCheck,
        href: "/admin/pos/terminal/reservation-monitor",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: CalendarDays,
        href: "/admin/reservations/calendar",
      },
      {
        id: "spaces",
        label: "Tables",
        icon: BetweenHorizontalStart,
        href: "/admin/spaces",
      },
      {
        id: "crm",
        label: "Customers",
        icon: Users,
        href: "/admin/pos/crm",
      },
      {
        id: "employees",
        label: "Employees",
        icon: Users,
        href: "/admin/pos/employee-credit",
      },
      {
        id: "sales",
        label: "Sales",
        icon: Tag,
        href: "/admin/pos/sales",
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: Warehouse,
        href: "/admin/pos/inventory",
        items: [
          {
            id: "inventory-overview",
            label: "Overview",
            icon: Warehouse,
            href: "/admin/pos/inventory",
          },
        ],
      },
      {
        id: "monitoring-reports",
        label: "Reports",
        icon: FileText,
        href: "/admin/pos/monitoring/reports",
      },
      {
        id: "monitor",
        label: "Monitor",
        icon: Monitor,
        href: "/admin/pos/monitor",
        items: [
          {
            id: "monitor-kitchen",
            label: "Kitchen Monitor",
            icon: ChefHat,
            href: "/admin/pos/monitor/kitchen",
          },
          {
            id: "monitor-bar",
            label: "Bar Monitor",
            icon: Coffee,
            href: "/admin/pos/monitor/bar",
          },
        ],
      },
    ],
  },
  {
    id: "iaccess",
    label: "iAccess",
    items: [
      {
        id: "users",
        label: "Users",
        icon: Users,
        href: "/admin/iaccess/users",
      },
      {
        id: "create-account",
        label: "Create Account",
        icon: Plus,
        href: "/admin/iaccess/users/new",
      },
      {
        id: "sponsorship",
        label: "Sponsorship",
        icon: Ad,
        href: "/admin/iaccess/sponsorship/new",
      },
      {
        id: "activity-logs",
        label: "Activity Logs",
        icon: TerminalIcon,
        href: "/admin/iaccess/activity-logs",
      },
    ],
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      overview: true,
    },
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  useEffect(() => {
    if (
      pathname.startsWith("/admin/pos/monitor/kitchen") ||
      pathname.startsWith("/admin/pos/monitor/bar")
    ) {
      setExpandedItems((prev) => ({ ...prev, monitor: true }));
    }
  }, [pathname]);

  return (
    <aside
      className={`sticky top-16 h-[calc(100vh-4rem)] border-r border-stone-200 bg-white transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col p-3">
        <nav className="flex-1 space-y-4 overflow-y-auto">
          {sidebarGroups.map((group) => (
            <div key={group.id}>
              {!sidebarCollapsed && (
                <button
                  type="button"
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
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    collapsed={sidebarCollapsed}
                    expandedItems={expandedItems}
                    toggleItem={toggleItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mt-3 w-full justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600"
        >
          {sidebarCollapsed ? "→" : "← Collapse"}
        </Button>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  item,
  collapsed,
  expandedItems,
  toggleItem,
}: {
  item: SidebarItem;
  collapsed: boolean;
  expandedItems: Record<string, boolean>;
  toggleItem: (id: string) => void;
}) {
  const pathname = usePathname();
  const hasChildren = !!item.items && item.items.length > 0;
  const isExpanded = !!expandedItems[item.id];
  const isActive =
    pathname === item.href ||
    (item.href !== "/admin/pos" && pathname.startsWith(`${item.href}/`));

  if (!hasChildren) {
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
          isActive
            ? "bg-[#F36509]/10 font-medium text-[#F36509]"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />

        {!collapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>

            {item.badge && (
              <Badge className="h-5 min-w-5 bg-[#F36509] px-1.5 text-[10px] text-white hover:bg-[#F36509]">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  }

  const Icon = item.icon;
  return (
    <div>
      <button
        type="button"
        onClick={() => toggleItem(item.id)}
        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
          isActive
            ? "bg-[#F36509]/10 font-medium text-[#F36509]"
            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        }`}
      >
        <Icon className="h-5 w-5 shrink-0" />

        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </>
        )}
      </button>

      {!collapsed && isExpanded && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-stone-200 pl-2">
          {item.items!.map((child) => (
            <SidebarNavItem
              key={child.id}
              item={child as SidebarItem}
              collapsed={collapsed}
              expandedItems={expandedItems}
              toggleItem={toggleItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminSidebar;
