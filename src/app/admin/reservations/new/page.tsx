import { ReservationForm } from "@/components/sections/ReservationForm";

export default function NewReservationPage() {
  return (
    <main className="flex-1 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Reservation</h1>
        <p className="text-muted-foreground">
          Create a reservation for a guest (Admin)
        </p>
      </div>

      <ReservationForm mode="admin" />
    </main>
  );
}
