"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserWithRole, requireRole } from "@/lib/actions";

interface AdminRoleGateContextValue {
  user: UserWithRole | null;
  /**
   * Re-fetch the current user's role from the server.
   * Never exposed to the client as a writable value; the source of truth
   * is the server-side requireRole() / profiles.role.
   */
  loadUser: () => Promise<UserWithRole | null>;
}

const AdminRoleGateContext = createContext<AdminRoleGateContextValue | null>(
  null,
);

export function AdminRoleGateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const pathname = usePathname();

  // Load the user on the client and keep the role in sync with the
  // server. This is a display/UI gate only — all security decisions are
  // made server-side by requireRole().
  const loadUser = async (): Promise<UserWithRole | null> => {
    const next = await requireRole(["management", "cashier", "partner", "crew"]);
    setUser(next);
    return next;
  };

  // Initial load on mount.
  useState(async () => {
    const initial = await loadUser();
    if (!initial && pathname !== "/") {
      // Unauthenticated users are redirected by the server when they
      // hit an admin route; keep this harmless.
    }
  });

  const value = useMemo(
    () => ({ user, loadUser }),
    [user],
  );

  return <AdminRoleGateContext.Provider value={value}>{children}</AdminRoleGateContext.Provider>;
}

export function useAdminRoleGate(): AdminRoleGateContextValue {
  const ctx = useContext(AdminRoleGateContext);
  if (!ctx) throw new Error("useAdminRoleGate must be used within AdminRoleGateProvider");
  return ctx;
}
