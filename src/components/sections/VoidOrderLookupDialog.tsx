"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOrderByNumber,
  voidCompletedOrder,
  type PosOrder,
  type PosOrderItem,
  type PosPayment,
} from "@/lib/order-actions";

type LoadedOrder = PosOrder & {
  items: PosOrderItem[];
  payments: PosPayment[];
};

export type VoidOrderLookupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoided?: () => void | Promise<void>;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Terminal entry point: look up a completed order by number, then void it
 * with mandatory manager credentials.
 */
export function VoidOrderLookupDialog({
  open,
  onOpenChange,
  onVoided,
}: VoidOrderLookupDialogProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [order, setOrder] = useState<LoadedOrder | null>(null);

  const [reason, setReason] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [voidLoading, setVoidLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setOrderNumber("");
      setOrder(null);
      setReason("");
      setManagerEmail("");
      setManagerPassword("");
      setLookupLoading(false);
      setVoidLoading(false);
    }
  }, [open]);

  async function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) {
      toast.error("Enter an order number");
      return;
    }
    setLookupLoading(true);
    setOrder(null);
    try {
      const result = await getOrderByNumber(trimmed);
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Order not found");
        return;
      }
      if (result.data.status !== "completed") {
        toast.error(
          `Only completed orders can be voided (status: ${result.data.status})`,
        );
        setOrder(result.data);
        return;
      }
      setOrder(result.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to look up order");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleVoid(event: React.FormEvent) {
    event.preventDefault();
    if (!order || voidLoading) return;

    if (order.status !== "completed") {
      toast.error("Only completed orders can be voided");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error("Enter a void reason (at least 3 characters)");
      return;
    }
    if (!managerEmail.trim() || !managerPassword) {
      toast.error("Manager email and password are required");
      return;
    }

    setVoidLoading(true);
    try {
      const result = await voidCompletedOrder({
        orderId: order.id,
        reason: reason.trim(),
        managerEmail: managerEmail.trim(),
        managerPassword,
      });
      if (!result.success) {
        toast.error(result.error ?? "Void failed");
        return;
      }
      if (result.alreadyVoided) {
        toast.message("Order was already voided");
      } else {
        toast.success(`Order ${order.order_number} voided`);
      }
      onOpenChange(false);
      await onVoided?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Unexpected error while voiding",
      );
    } finally {
      setVoidLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (lookupLoading || voidLoading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Void completed order
          </DialogTitle>
          <DialogDescription>
            Look up a paid order by number. A management account must authorize
            the void. Inventory is restored and the order is excluded from
            sales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="void-lookup-number" className="sr-only">
              Order number
            </Label>
            <Input
              id="void-lookup-number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="ORD-20261105-ABC123"
              disabled={lookupLoading || voidLoading}
              autoComplete="off"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={lookupLoading || voidLoading}
            className="shrink-0"
          >
            {lookupLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="mr-1.5 h-4 w-4" />
                Find
              </>
            )}
          </Button>
        </form>

        {order && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-stone-900">
                  {order.order_number}
                </p>
                <p className="text-xs text-stone-500 capitalize">
                  Status: {order.status.replace("_", " ")}
                </p>
              </div>
              <p className="text-sm font-semibold text-stone-900">
                {formatMoney(order.total_amount)}
              </p>
            </div>

            {order.items.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-2 text-stone-700"
                  >
                    <span>
                      {item.quantity}× {item.product_name}
                    </span>
                    <span className="shrink-0">
                      {formatMoney(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {order.status === "completed" ? (
              <form onSubmit={handleVoid} className="space-y-3 border-t border-stone-200 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="void-lookup-reason">Reason</Label>
                  <Input
                    id="void-lookup-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Unable to provide ordered item"
                    disabled={voidLoading}
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3">
                  <p className="text-xs font-medium text-amber-900">
                    Manager authorization
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="void-lookup-mgr-email">Manager email</Label>
                    <Input
                      id="void-lookup-mgr-email"
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      disabled={voidLoading}
                      autoComplete="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="void-lookup-mgr-password">
                      Manager password
                    </Label>
                    <Input
                      id="void-lookup-mgr-password"
                      type="password"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      disabled={voidLoading}
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={voidLoading}
                    onClick={() => onOpenChange(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={voidLoading}
                    className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                  >
                    {voidLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Voiding…
                      </>
                    ) : (
                      "Void order"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            ) : (
              <p className="text-sm text-red-700">
                This order cannot be voided because it is not completed.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
