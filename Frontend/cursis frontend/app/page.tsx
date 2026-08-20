import { AISection } from "@/components/marketing/AISection";
import { FreeDataManagementSection } from "@/components/marketing/FreeDataManagementSection";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Navbar } from "@/components/marketing/Navbar";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { BringBusinessDataTogetherSection, DataManagementContent } from "@/components/marketing/DataManagementPage";
import { InteractiveFeatureShowcase } from "@/components/marketing/InteractiveFeatureShowcase";
import { WebBuilderSection } from "@/components/marketing/WebBuilderSection";
import { WhyDataora } from "@/components/marketing/WhyDataora";

export default function Home() {
  return (
    <div className="overflow-x-clip bg-[#f8f9f6]">
      <Navbar />
      <Hero />
      <ProblemSection />
      <DataManagementContent />
      <InteractiveFeatureShowcase />
      <BringBusinessDataTogetherSection />
      <WebBuilderSection />
      <AISection />
      <HowItWorks />
      <FreeDataManagementSection />
      <WhyDataora />
      <Footer />
    </div>
  );
}
