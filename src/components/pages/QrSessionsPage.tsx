// app/pos/qr-sessions/page.tsx   (adjust path to your router)

import Link from "next/link"; // or react-router's Link
import { QrCode, RefreshCw, Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner"; // whatever you use today
import { QRCodeSVG } from "qrcode.react"; // whatever you use today

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PosSession } from "@/lib/pos-actions";

/* ---- Types: adjust to your actual models ---- */
interface QrSession {
  id: string;
  qr_token: string;
  expires_at: string;
  // ...whatever else your session has
}
interface Table {
  id: string;
  table_number: string;
  zone: string;
  seats: number;
}
interface Room {
  id: string;
  name: string;
  seats: number;
}

interface QrSessionsPageProps {
  sessions: PosSession[];
  tables: Table[];
  rooms: Room[];
  isLoadingSessions: boolean;
  isCreatingSession: boolean;
  showCreateSessionDialog: boolean;
  setShowCreateSessionDialog: (open: boolean) => void;
  createSessionForm: { type: "table" | "room"; id: string };
  setCreateSessionForm: (form: { type: "table" | "room"; id: string }) => void;
  createdSessionUrl: string | null;
  setCreatedSessionUrl: (url: string | null) => void;
  createdSessionToken: string | null;
  loadSessions: () => void;
  handleCreateSession: () => void;
  handleDeactivateSession: (id: string) => void;
  copySessionUrl: () => void;
  getSessionStatus: (session: PosSession) => "active" | "expired" | string;
  getSessionLocation: (session: PosSession) => string;
  getSessionStatusBadge: (status: string) => React.ReactNode;
}

export default function QrSessionsPage(props: QrSessionsPageProps) {
  const {
    sessions,
    tables,
    rooms,
    isLoadingSessions,
    isCreatingSession,
    showCreateSessionDialog,
    setShowCreateSessionDialog,
    createSessionForm,
    setCreateSessionForm,
    createdSessionUrl,
    setCreatedSessionUrl,
    createdSessionToken,
    loadSessions,
    handleCreateSession,
    handleDeactivateSession,
    copySessionUrl,
    getSessionStatus,
    getSessionLocation,
    getSessionStatusBadge,
  } = props;

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 bg-stone-50/50">
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pos/terminal/primary"
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              aria-label="Back to terminal"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="rounded-xl bg-[#F36509]/10 p-2">
              <QrCode className="h-5 w-5 text-[#F36509]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                QR Order Sessions
              </h1>
              <p className="text-sm text-stone-500">
                Create sessions for tables or rooms. Customers scan to order.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {sessions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                <span>Active:</span>
                {sessions
                  .filter((s) => getSessionStatus(s) === "active")
                  .map((s) => (
                    <Badge
                      key={s.id}
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {getSessionLocation(s)}
                    </Badge>
                  ))}
              </div>
            )}

            <Dialog
              open={showCreateSessionDialog}
              onOpenChange={setShowCreateSessionDialog}
            >
              <DialogTrigger>
                <Button
                  className="rounded-md bg-[#F36509] text-white hover:bg-[#d95a08]"
                  disabled={
                    isCreatingSession ||
                    (tables.length === 0 && rooms.length === 0)
                  }
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {isCreatingSession ? "Creating..." : "Create QR Session"}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    Create QR Session
                  </DialogTitle>
                  <DialogDescription>
                    Select a table or room to generate a QR code for customer
                    ordering.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">
                      Location Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="sessionType"
                          value="table"
                          checked={createSessionForm.type === "table"}
                          onChange={() =>
                            setCreateSessionForm({ type: "table", id: "" })
                          }
                          className="h-4 w-4 border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                        />
                        <span className="text-sm text-stone-700">Table</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="sessionType"
                          value="room"
                          checked={createSessionForm.type === "room"}
                          onChange={() =>
                            setCreateSessionForm({ type: "room", id: "" })
                          }
                          className="h-4 w-4 border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                        />
                        <span className="text-sm text-stone-700">Room</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">
                      {createSessionForm.type === "table"
                        ? "Select Table"
                        : "Select Room"}
                    </label>
                    <select
                      value={createSessionForm.id}
                      onChange={(e) =>
                        setCreateSessionForm({
                          ...createSessionForm,
                          id: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border-stone-200 bg-white px-3 py-2 text-sm focus-visible:ring-[#F36509]/30"
                    >
                      <option value="">Choose...</option>
                      {createSessionForm.type === "table"
                        ? tables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.table_number} ({t.zone}, {t.seats} seats)
                            </option>
                          ))
                        : rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.seats} seats)
                            </option>
                          ))}
                    </select>
                  </div>
                </div>
                <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateSessionDialog(false)}
                    disabled={isCreatingSession}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={isCreatingSession || !createSessionForm.id}
                    className="rounded-md bg-[#F36509] text-white hover:bg-[#d95a08]"
                  >
                    {isCreatingSession ? "Creating..." : "Create Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              type="button"
              variant="outline"
              onClick={loadSessions}
              disabled={isLoadingSessions}
              className="text-stone-500"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoadingSessions ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Sessions list */}
      <div className="px-4 py-4 sm:px-6">
        <div className="mx-auto">
          {sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => {
                const status = getSessionStatus(session);
                return (
                  <div
                    key={session.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-stone-900">
                            {getSessionLocation(session)}
                          </p>
                          {getSessionStatusBadge(status)}
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-stone-400">
                          {session.id.slice(0, 8)}...
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Expires{" "}
                          {new Date(session.expires_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {status === "active" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateSession(session.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const baseUrl =
                              typeof window !== "undefined"
                                ? window.location.origin
                                : "";
                            navigator.clipboard.writeText(
                              `${baseUrl}/menu?session=${session.qr_token}`,
                            );
                            toast.success("URL copied");
                          }}
                          className="text-stone-600 hover:bg-stone-100"
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy URL
                        </Button>

                        {createdSessionToken === session.qr_token &&
                          createdSessionUrl && (
                            <Dialog
                              open={true}
                              onOpenChange={() => setCreatedSessionUrl(null)}
                            >
                              <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="font-serif text-xl">
                                    QR Session Created
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex justify-center">
                                    <QRCodeSVG
                                      value={createdSessionUrl}
                                      size={180}
                                      level="M"
                                    />
                                  </div>
                                  <div className="space-y-2 text-center">
                                    <p className="font-medium text-stone-900">
                                      {getSessionLocation(session)}
                                    </p>
                                    <p className="break-all text-sm text-stone-500">
                                      {createdSessionUrl}
                                    </p>
                                    <p className="text-xs text-stone-400">
                                      Expires:{" "}
                                      {new Date(
                                        session.expires_at,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={copySessionUrl}
                                      className="flex-1"
                                    >
                                      Copy URL
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => setCreatedSessionUrl(null)}
                                      className="flex-1 bg-[#F36509] text-white hover:bg-[#d95a08]"
                                    >
                                      Done
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !isLoadingSessions ? (
            <div className="rounded-xl border border-stone-200 bg-white py-16 text-center text-stone-500">
              <QrCode className="mx-auto mb-2 h-8 w-8 text-stone-300" />
              <p>No QR sessions yet. Create one to get started.</p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
