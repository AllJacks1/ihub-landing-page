import FoodDrinksSection from "@/components/sections/FoodDrinksSection";
import Hero from "@/components/sections/HeroSection";
import ILoungeSection from "@/components/sections/ILoungeSection";
import OffersSection from "@/components/sections/OffersSection";
import WhySection from "@/components/sections/WhySection";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="-mt-20">
      <Hero/>
      <WhySection/>
      <ILoungeSection/>
      <OffersSection/>
      <FoodDrinksSection/>
    </div>
  );
}
