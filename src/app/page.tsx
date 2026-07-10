import Hero from "@/components/sections/HeroSection";
import ILoungeSection from "@/components/sections/ILoungeSection";
import WhySection from "@/components/sections/WhySection";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="-mt-20">
      <Hero/>
      <WhySection/>
      <ILoungeSection/>
    </div>
  );
}
