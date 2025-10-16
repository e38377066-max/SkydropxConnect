import QuickQuoteSection from "@/components/QuickQuoteSection";
import PromotionalSection from "@/components/PromotionalSection";
import HowItWorks from "@/components/HowItWorks";
import CarriersSection from "@/components/CarriersSection";
import FeaturesSection from "@/components/FeaturesSection";
import CTASection from "@/components/CTASection";

export default function HomePage() {
  return (
    <div className="bg-background">
      <QuickQuoteSection />
      <PromotionalSection />
      <HowItWorks />
      <CarriersSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
