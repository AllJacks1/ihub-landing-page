"use client";

import { Suspense } from "react";
import MenuInner from "./menu-inner";

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-50">
          <div className="flex items-center gap-2 text-stone-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#F36509] border-t-transparent" />
            <span>Loading menu...</span>
          </div>
        </div>
      }
    >
      <MenuInner />
    </Suspense>
  );
}
