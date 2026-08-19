import ContactPage from "@/components/pages/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | iHub Davao",
  description:
    "Get in touch with iHub Davao. Visit us at Pines Place, Pioneer Drive, Bajada, Davao City. Call 0985 571 3768, email ihubdavao@gmail.com, or message us on Facebook. Open 24/7.",
  keywords: [
    "iHub Davao contact",
    "coworking Davao",
    "Bajada coworking",
    "Pines Place",
    "iHub phone number",
    "Davao City coworking space",
  ],
  openGraph: {
    title: "Contact Us | iHub Davao",
    description:
      "Visit iHub at Pines Place, Bajada, Davao City. Open 24/7. Call, email, or message us anytime.",
    type: "website",
    images: [
      {
        url: "/images/contact_header.png",
        width: 1200,
        height: 630,
        alt: "iHub Davao Contact",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | iHub Davao",
    description:
      "Get in touch with iHub Davao. Open 24/7 at Pines Place, Bajada.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function Page() {
  return (
    <div>
      <ContactPage />
    </div>
  );
}

export default Page;
