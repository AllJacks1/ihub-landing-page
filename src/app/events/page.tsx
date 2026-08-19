import EventsPage from "@/components/pages/Events";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events at iHub | Community & Celebrations",
  description:
    "Discover past and upcoming events at iHub Davao — photo contests, speed dating, anonymous confessions, and more. Host your next gathering in our 24/7 coworking and bistro space in Bajada.",
  keywords: [
    "iHub events",
    "Davao events",
    "coworking events",
    "speed dating Davao",
    "Halloween event",
    "Valentine's event Davao",
    "event venue Bajada",
    "iHub community",
  ],
  openGraph: {
    title: "Events at iHub | Community & Celebrations",
    description:
      "Where good vibes, great people, and unforgettable moments come together. Past highlights and upcoming events at iHub Davao.",
    type: "website",
    images: [
      {
        url: "/images/events-hero.png",
        width: 1200,
        height: 630,
        alt: "iHub Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events at iHub | Community & Celebrations",
    description:
      "Past highlights and upcoming events at iHub Davao. Host your next gathering with us.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Page() {
  return (
    <div>
      <EventsPage />
    </div>
  );
}

export default Page;
