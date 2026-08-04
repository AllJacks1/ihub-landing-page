import FloorClient from "@/components/pages/FloorClient";
import {
  getTables,
  getRooms,
  getReservationsWithAssignments,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FloorPage() {
  const [tablesRes, roomsRes, reservationsRes] = await Promise.all([
    getTables(),
    getRooms(),
    getReservationsWithAssignments({
      status: ["pending", "confirmed", "seated"],
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold tracking-tight text-stone-900">
          Floor & Spaces
        </h1>
        <p className="text-stone-500 mt-1.5">
          Manage tables, rooms, and assign them to reservations
        </p>
      </div>

      <FloorClient
        initialTables={tablesRes.data ?? []}
        initialRooms={roomsRes.data ?? []}
        initialReservations={reservationsRes.data ?? []}
      />
    </div>
  );
}
