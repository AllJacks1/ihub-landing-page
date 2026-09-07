"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Search, RefreshCw, Activity, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchLogs } from "@/app/actions/users";

/* ── types ── */
interface LogEntry {
  logsId: string | number;
  activity: string | null;
  created_at: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchLogs();
      if (result.success) {
        setLogs(result.data ?? []);
      } else {
        toast.error(result.error || "Failed to load logs");
        setLogs([]);
      }
    } catch {
      toast.error("Failed to load logs");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return logs;

    const q = searchQuery.toLowerCase();
    return logs.filter((log) => {
      const activity = (log.activity ?? "").toLowerCase();
      const dateStr = log.created_at
        ? format(
            toZonedTime(new Date(log.created_at), "Asia/Manila"),
            "MMM d, yyyy h:mm a",
          ).toLowerCase()
        : "";

      return activity.includes(q) || dateStr.includes(q);
    });
  }, [logs, searchQuery]);

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Activity Logs
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Track system and member activity
          </p>
        </div>
        <Button
          onClick={loadLogs}
          variant="outline"
          className="border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by action or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="mt-6 overflow-hidden border-stone-200 bg-white">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading logs...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-stone-50 p-4">
                <Activity className="h-8 w-8 text-stone-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-900">
                {searchQuery ? "No matching logs" : "No logs yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Activity will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pr-4 pl-6 text-left font-medium text-stone-500">
                      Action
                    </th>
                    <th className="px-4 py-3.5 text-left font-medium text-stone-500">
                      Date & Time (PHT)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((log) => {
                    const manilaDate = log.created_at
                      ? toZonedTime(new Date(log.created_at), "Asia/Manila")
                      : null;

                    return (
                      <tr
                        key={log.logsId}
                        className="group transition-colors hover:bg-stone-50/80"
                      >
                        <td className="py-4 pr-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-stone-100 p-2">
                              <Activity className="h-4 w-4 text-stone-500" />
                            </div>
                            <span className="font-medium text-stone-900">
                              {log.activity || "—"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {manilaDate ? (
                            <div className="flex items-center gap-1.5 text-stone-600">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" />
                              <span>{format(manilaDate, "MMM d, yyyy")}</span>
                              <span className="text-stone-400">•</span>
                              <span className="text-stone-500">
                                {format(manilaDate, "h:mm a")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer count */}
      {!isLoading && filtered.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
          <p>
            Showing{" "}
            <span className="font-medium text-stone-900">
              {filtered.length}
            </span>{" "}
            log{filtered.length !== 1 ? "s" : ""}
          </p>
          <p>Newest first</p>
        </div>
      )}
    </main>
  );
}
