"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/sections/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && (
        <header>
          <Navbar />
        </header>
      )}

      {children}

      {!isAdminRoute && (
        <footer>
          <Footer />
        </footer>
      )}
    </>
  );
}
