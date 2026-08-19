import PassesPage from "@/components/pages/Passes";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iAccess & iStudy Passes | iHub Membership",
  description:
    "Get iAccess annual memberships and iStudy productivity passes at iHub. Unlock coworking hours, café & printing discounts, and 5% savings across 8 Astra Group partners. August Advantage 2026 promo available.",
  keywords: [
    "iAccess membership",
    "iStudy pass",
    "iHub membership",
    "coworking pass Davao",
    "annual membership",
    "study pass",
    "Astra Group discount",
    "coworking hours",
  ],
  openGraph: {
    title: "iAccess & iStudy Passes | iHub",
    description:
      "Annual memberships and productivity passes with coworking hours, café discounts, and 5% partner savings across Astra Group.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iAccess & iStudy Passes | iHub",
    description:
      "Unlock coworking hours, café discounts, and exclusive Astra Group partner savings.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <PassesPage />;
}
