"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function MonitorAutoRefresh({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const channel = supabase
      .channel("pos_orders_monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "pos_orders" }, () => {
        router.refresh();
      })
      .subscribe();

    const id = setInterval(() => router.refresh(), intervalMs);
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [router, intervalMs]);
  return null;
}
