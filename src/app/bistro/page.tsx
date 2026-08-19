import BistroPage from "@/components/pages/Bistro";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iHub Bistro | Good Food. Great Vibes.",
  description:
    "24/7 comfort food, Filipino classics, and new favorites at iHub Bistro in Bajada, Davao. Try our signature Bangsilog, pasta lineup, silog meals, and artisan coffee. Reserve a table or view the full menu.",
  keywords: [
    "iHub Bistro",
    "Davao restaurant",
    "Bajada cafe",
    "Bangsilog",
    "Filipino food Davao",
    "24/7 cafe",
    "coworking cafe",
    "pasta",
    "silog meals",
    "artisan coffee",
  ],
  openGraph: {
    title: "iHub Bistro | Good Food. Great Vibes.",
    description:
      "24/7 comfort food and Filipino classics in Bajada, Davao. Signature Bangsilog, pasta, silog meals & artisan coffee.",
    type: "website",
    images: [
      {
        url: "/images/bistroThumbnail.png",
        width: 1200,
        height: 630,
        alt: "iHub Bistro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "iHub Bistro | Good Food. Great Vibes.",
    description:
      "24/7 comfort food, Filipino classics, and artisan coffee at iHub Bistro in Davao.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <BistroPage />;
}
