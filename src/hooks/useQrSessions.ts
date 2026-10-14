"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  createLocation,
  createPosSession,
  deactivatePosSession,
  deleteLocation,
  getLocations,
  getPosSessions,
  PosSession,
  setLocationActive,
  updateLocation,
} from "@/lib/pos-actions";
import {
  getLocationLabel,
  LOCATION_TYPE_LABELS,
  LocationType,
  PosLocation,
} from "@/lib/pos-locations";

type LocationFormState = {
  name: string;
  seats: number;
  zone: "bistro" | "coworking";
  description: string;
};

const DEFAULT_LOCATION_FORM: LocationFormState = {
  name: "",
  seats: 4,
  zone: "bistro",
  description: "",
};

export function useQrSessions() {
  // ── Sessions ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState<{
    type: LocationType;
    id: string;
  }>({ type: "table", id: "" });
  const [createdSessionUrl, setCreatedSessionUrl] = useState<string | null>(
    null,
  );
  const [createdSessionToken, setCreatedSessionToken] = useState<string | null>(
    null,
  );

  // ── Locations ─────────────────────────────────────────────────────────────
  const [locations, setLocations] = useState<
    Record<LocationType, PosLocation[]>
  >({
    table: [],
    room: [],
    cubicle: [],
  });
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showManageLocationsDialog, setShowManageLocationsDialog] =
    useState(false);
  const [activeLocationTab, setActiveLocationTab] =
    useState<LocationType>("table");
  const [locationForm, setLocationForm] = useState<LocationFormState>(
    DEFAULT_LOCATION_FORM,
  );
  const [editingLocation, setEditingLocation] = useState<PosLocation | null>(
    null,
  );
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [togglingLocationId, setTogglingLocationId] = useState<string | null>(
    null,
  );
  const [removingLocationId, setRemovingLocationId] = useState<string | null>(
    null,
  );

  // ── Loaders ───────────────────────────────────────────────────────────────
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
    setIsLoadingLocations(true);
    try {
      const [tables, rooms, cubicles] = await Promise.all([
        getLocations("table"),
        getLocations("room"),
        getLocations("cubicle"),
      ]);

      setLocations({
        table: tables.success ? tables.data : [],
        room: rooms.success ? rooms.data : [],
        cubicle: cubicles.success ? cubicles.data : [],
      });

      // Surface individual failures without blocking the rest
      if (!tables.success) toast.error(tables.error || "Failed to load tables");
      if (!rooms.success) toast.error(rooms.error || "Failed to load rooms");
      if (!cubicles.success)
        toast.error(cubicles.error || "Failed to load cubicles");
    } catch (error) {
      console.error("Failed to load locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadLocations();
  }, [loadSessions, loadLocations]);

  // ── Session handlers ──────────────────────────────────────────────────────
  async function handleCreateSession() {
    if (!createSessionForm.id) return;

    setIsCreatingSession(true);
    try {
      const { type, id } = createSessionForm;
      const result = await createPosSession({
        table_id: type === "table" ? id : undefined,
        room_id: type === "room" ? id : undefined,
        cubicle_id: type === "cubicle" ? id : undefined,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to create session");
        return;
      }

      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      setCreatedSessionUrl(`${baseUrl}/menu?session=${result.data.qr_token}`);
      setCreatedSessionToken(result.data.qr_token);
      await loadSessions();
      toast.success("QR session created successfully");
    } catch (error) {
      console.error("Create session error:", error);
      toast.error("Failed to create session");
    } finally {
      setIsCreatingSession(false);
      setShowCreateSessionDialog(false);
      setCreateSessionForm({ type: "table", id: "" });
    }
  }

  async function handleDeactivateSession(id: string) {
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
  }

  function copySessionUrl() {
    if (!createdSessionUrl) return;
    navigator.clipboard.writeText(createdSessionUrl);
    toast.success("URL copied");
  }

  function getSessionStatus(session: PosSession) {
    return session.is_active && new Date(session.expires_at) > new Date()
      ? "active"
      : "expired";
  }

  function getSessionLocation(session: PosSession) {
    if (session.table_number)
      return getLocationLabel("table", session.table_number);
    if (session.room_name) return getLocationLabel("room", session.room_name);
    if (session.cubicle_name)
      return getLocationLabel("cubicle", session.cubicle_name);
    return "Unknown";
  }

  // ── Location handlers ─────────────────────────────────────────────────────
  function openAddLocationForm(type: LocationType) {
    setActiveLocationTab(type);
    setEditingLocation(null);
    setLocationForm({
      ...DEFAULT_LOCATION_FORM,
      seats: type === "cubicle" ? 1 : 4,
    });
    setIsLocationFormOpen(true);
  }

  function openEditLocationForm(location: PosLocation) {
    setActiveLocationTab(location.type);
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      seats: location.seats,
      zone: (location.zone as "bistro" | "coworking") ?? "bistro",
      description: location.description ?? "",
    });
    setIsLocationFormOpen(true);
  }

  function cancelLocationForm() {
    setEditingLocation(null);
    setIsLocationFormOpen(false);
    setLocationForm(DEFAULT_LOCATION_FORM);
  }

  async function handleSaveLocation() {
    if (!locationForm.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    setIsSavingLocation(true);
    try {
      const payload = {
        type: activeLocationTab,
        name: locationForm.name.trim(),
        seats: locationForm.seats,
        zone: locationForm.zone,
        description: locationForm.description.trim() || null,
      };

      const result = editingLocation
        ? await updateLocation({ ...payload, id: editingLocation.id })
        : await createLocation(payload);

      if (!result.success) {
        toast.error(result.error || "Failed to save location");
        return;
      }

      toast.success(
        editingLocation
          ? `${LOCATION_TYPE_LABELS[activeLocationTab]} updated`
          : `${LOCATION_TYPE_LABELS[activeLocationTab]} created`,
      );
      cancelLocationForm();
      await loadLocations();
    } catch (error) {
      console.error("Save location error:", error);
      toast.error("Failed to save location");
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleToggleLocation(location: PosLocation) {
    setTogglingLocationId(location.id);
    try {
      const result = await setLocationActive({
        type: location.type,
        id: location.id,
        is_active: !location.is_active,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update location");
        return;
      }

      toast.success(
        `${getLocationLabel(location.type, location.name)} ${
          !location.is_active ? "activated" : "deactivated"
        }`,
      );
      await loadLocations();
    } catch (error) {
      console.error("Toggle location error:", error);
      toast.error("Failed to update location");
    } finally {
      setTogglingLocationId(null);
    }
  }

  async function handleDeleteLocation(location: PosLocation) {
    setRemovingLocationId(location.id);
    try {
      const result = await deleteLocation({
        type: location.type,
        id: location.id,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to remove location");
        return;
      }

      toast.success(`${LOCATION_TYPE_LABELS[location.type]} removed`);
      await loadLocations();
    } catch (error) {
      console.error("Remove location error:", error);
      toast.error("Failed to remove location");
    } finally {
      setRemovingLocationId(null);
    }
  }

  return {
    // Sessions
    sessions,
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

    // Locations
    locations,
    isLoadingLocations,
    showManageLocationsDialog,
    setShowManageLocationsDialog,
    activeLocationTab,
    setActiveLocationTab,
    locationForm,
    setLocationForm,
    editingLocation,
    isLocationFormOpen,
    isSavingLocation,
    togglingLocationId,
    removingLocationId,
    loadLocations,
    openAddLocationForm,
    openEditLocationForm,
    cancelLocationForm,
    handleSaveLocation,
    handleToggleLocation,
    handleDeleteLocation,
  };
}
