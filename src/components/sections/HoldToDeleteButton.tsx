"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HoldToDeleteButtonProps {
  onConfirm: () => void;
  isLoading?: boolean;
  holdDurationMs?: number;
  label?: string;
  className?: string;
}

export default function HoldToDeleteButton({
  onConfirm,
  isLoading = false,
  holdDurationMs = 3000,
  label = "Hold to delete",
  className,
}: HoldToDeleteButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  // Keep latest values in refs so the rAF loop never closes over stale props
  const holdDurationRef = useRef(holdDurationMs);
  const onConfirmRef = useRef(onConfirm);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    holdDurationRef.current = holdDurationMs;
  }, [holdDurationMs]);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  const stopHolding = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setProgress(0);
    completedRef.current = false;
  }, []);

  const startHolding = useCallback(() => {
    if (isLoadingRef.current || completedRef.current) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    setProgress(0);

    const loop = () => {
      if (startTimeRef.current === null) return;

      const elapsed = Date.now() - startTimeRef.current;
      const next = Math.min(100, (elapsed / holdDurationRef.current) * 100);
      setProgress(next);

      if (next >= 100 && !completedRef.current) {
        completedRef.current = true;
        onConfirmRef.current();
        // Reset without going through stopHolding so progress stays at 100
        // briefly until isLoading kicks in; still cancel the frame.
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        startTimeRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Cancel if window loses focus
  useEffect(() => {
    const handleBlur = () => stopHolding();
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [stopHolding]);

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isLoading}
      className={cn(
        "relative overflow-hidden select-none min-w-[140px]",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        startHolding();
      }}
      onPointerUp={stopHolding}
      onPointerLeave={stopHolding}
      onPointerCancel={stopHolding}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Progress fill */}
      <span
        className="absolute inset-0 bg-red-800/60 origin-left transition-none"
        style={{ transform: `scaleX(${progress / 100})` }}
        aria-hidden
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Deleting…
          </>
        ) : isHolding ? (
          <>
            Hold…{" "}
            {Math.ceil(((100 - progress) / 100) * (holdDurationMs / 1000))}s
          </>
        ) : (
          label
        )}
      </span>
    </Button>
  );
}
