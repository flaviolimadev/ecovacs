import HeroBanner from "@/components/HeroBanner";
import TransactionNotification from "@/components/TransactionNotification";
import ActionButtonsGrid from "@/components/ActionButtonsGrid";
import FeatureCards from "@/components/FeatureCards";
import ProductsSection from "@/components/ProductsSection";
import BottomNavigation from "@/components/BottomNavigation";
import FloatingMessageButton from "@/components/FloatingMessageButton";
import WelcomePopup from "@/components/WelcomePopup";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background pb-20">
      <WelcomePopup />
      <HeroBanner />
      <TransactionNotification />
      <ActionButtonsGrid />
      <FeatureCards />
      <ProductsSection />
      <FloatingMessageButton />
      <BottomNavigation />
    </div>
  );
};

export default Index;
