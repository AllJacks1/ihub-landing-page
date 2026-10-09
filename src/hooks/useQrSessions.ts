"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  createPosSession,
  deactivatePosSession,
  getPosSessions,
  PosSession,
  Room,
  Table,
} from "@/lib/pos-actions";
import { getRooms, getTables } from "@/lib/actions";

export function useQrSessions() {
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState<{
    type: "table" | "room";
    id: string;
  }>({ type: "table", id: "" });
  const [createdSessionUrl, setCreatedSessionUrl] = useState<string | null>(
    null,
  );
  const [createdSessionToken, setCreatedSessionToken] = useState<string | null>(
    null,
  );

  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const result = await getPosSessions();
      if (result.success) {
        setSessions(result.data);
      } else {
        toast.error(result.error ?? "Failed to load sessions");
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([getTables(), getRooms()]);
      if (t.success) setTables(t.data);
      if (r.success) setRooms(r.data);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadLocations();
  }, [loadSessions, loadLocations]);

  const handleCreateSession = async () => {
    if (!createSessionForm.id) return;
    setIsCreatingSession(true);
    try {
      // Map the form shape → server action shape
      const payload =
        createSessionForm.type === "table"
          ? { table_id: createSessionForm.id }
          : { room_id: createSessionForm.id };

      const result = await createPosSession(payload);

      if (result.success && result.data) {
        toast.success("Session created");
        setShowCreateSessionDialog(false);
        setCreateSessionForm({ type: "table", id: "" });
        setCreatedSessionToken(result.data.qr_token);
        const baseUrl = window.location.origin;
        setCreatedSessionUrl(`${baseUrl}/menu?session=${result.data.qr_token}`);
        await loadSessions();
      } else {
        toast.error(result.error ?? "Failed to create session");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
      toast.error("Failed to create session");
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeactivateSession = async (id: string) => {
    try {
      const result = await deactivatePosSession(id);
      if (result.success) {
        toast.success("Session deactivated");
        await loadSessions();
      } else {
        toast.error(result.error ?? "Failed to deactivate");
      }
    } catch (error) {
      console.error("Failed to deactivate session:", error);
      toast.error("Failed to deactivate");
    }
  };

  const copySessionUrl = () => {
    if (!createdSessionUrl) return;
    navigator.clipboard.writeText(createdSessionUrl);
    toast.success("URL copied");
  };

  const getSessionStatus = (session: PosSession) =>
    session.is_active && new Date(session.expires_at) > new Date()
      ? "active"
      : "expired";

  // Use the flattened fields that the server action already maps
  const getSessionLocation = (session: PosSession) => {
    if (session.table_number) {
      // Optional: look up zone from the tables list if you need it
      const table = tables.find((t) => t.id === session.table_id);
      return table
        ? `Table ${session.table_number} (${table.zone})`
        : `Table ${session.table_number}`;
    }
    if (session.room_name) {
      return session.room_name;
    }
    return "Unknown";
  };

  return {
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
  };
}
