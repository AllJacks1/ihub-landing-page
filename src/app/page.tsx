import CTASection from "@/components/sections/CTASection";
import EventsSection from "@/components/sections/EventsSection";
import FoodDrinksSection from "@/components/sections/FoodDrinksSection";
import GallerySection from "@/components/sections/GallerySection";
import Hero from "@/components/sections/HeroSection";
import ILoungeSection from "@/components/sections/ILoungeSection";
import LocationSection from "@/components/sections/LocationSection";
import OffersSection from "@/components/sections/OffersSection";
import WhySection from "@/components/sections/WhySection";

export default function Home() {
  return (
    <div className="-mt-20">
      <Hero />
      <WhySection />
      <ILoungeSection />
      <GallerySection/>
      <OffersSection />
      <FoodDrinksSection />
      <EventsSection />
      <LocationSection />
      <CTASection />
    </div>
  );
}
