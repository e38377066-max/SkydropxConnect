import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import CarriersSection from "@/components/CarriersSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export default function HomePage() {
  return (
    <div className="bg-background">
      <Hero />
      <HowItWorks />
      <CarriersSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
