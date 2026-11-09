"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
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
import { voidCompletedOrder } from "@/lib/order-actions";

export type VoidOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  orderNumber?: string | null;
  orderTotal?: number | null;
  /** Called after a successful void so the parent can refresh lists */
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
 * Manager-authorized full-order void.
 * Requires a management account email + password that is different from the
 * currently signed-in cashier. The cashier cannot authorize their own void.
 */
export function VoidOrderDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  orderTotal,
  onVoided,
}: VoidOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setManagerEmail("");
      setManagerPassword("");
      setLoading(false);
    }
  }, [open]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      toast.error("Enter a void reason (at least 3 characters)");
      return;
    }
    if (!managerEmail.trim() || !managerPassword) {
      toast.error("Manager email and password are required");
      return;
    }

    setLoading(true);
    try {
      const result = await voidCompletedOrder({
        orderId,
        reason: trimmedReason,
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
        toast.success(
          orderNumber
            ? `Order ${orderNumber} voided`
            : "Order voided successfully",
        );
      }

      onOpenChange(false);
      await onVoided?.();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Unexpected error while voiding",
      );
    } finally {
      setLoading(false);
    }
  }

  const displayNumber = orderNumber?.trim() || orderId.slice(0, 8);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (loading) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-xl">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            Void completed order
          </DialogTitle>
          <DialogDescription className="space-y-1 text-left">
            <span className="block">
              Order <strong>{displayNumber}</strong>
              {orderTotal != null && Number.isFinite(orderTotal) ? (
                <>
                  {" "}
                  · {formatMoney(Number(orderTotal))}
                </>
              ) : null}
            </span>
            <span className="block text-stone-500">
              This reverses inventory, marks payments as refunded, and removes
              the order from sales totals. A management account must authorize
              the void. The cashier cannot authorize their own void.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="void-reason">Reason</Label>
            <Input
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Item unavailable — full order redo"
              disabled={loading}
              maxLength={500}
              autoComplete="off"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 space-y-3">
            <p className="text-xs font-medium text-amber-900">
              Manager authorization
            </p>
            <div className="space-y-2">
              <Label htmlFor="void-manager-email">Manager email</Label>
              <Input
                id="void-manager-email"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@example.com"
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="void-manager-password">Manager password</Label>
              <Input
                id="void-manager-password"
                type="password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Keep order
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
            >
              {loading ? (
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
      </DialogContent>
    </Dialog>
  );
}
