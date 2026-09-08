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
  const isIAccessMember = pathname.startsWith("/iaccess/member");

  const hideNavbarAndFooter = isAdminRoute || isIAccessMember;

  return (
    <>
      {!hideNavbarAndFooter && (
        <header>
          <Navbar />
        </header>
      )}

      {children}

      {!hideNavbarAndFooter && (
        <footer>
          <Footer />
        </footer>
      )}
    </>
  );
}
