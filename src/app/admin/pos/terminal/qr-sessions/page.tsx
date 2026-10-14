"use client";

import QrSessionsPage from "@/components/pages/QrSessionsPage";
import { useQrSessions } from "@/hooks/useQrSessions";

// Optional helper if you don't already have it in the hook
function getSessionStatusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs font-medium text-stone-500">
      Expired
    </span>
  );
}

export default function Page() {
  const qr = useQrSessions();

  return (
    <QrSessionsPage
      {...qr}
      getSessionStatusBadge={getSessionStatusBadge}
    />
  );
}