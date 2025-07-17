import { useState } from "react";
import { motion } from "framer-motion";
import NotchHeader from "@/components/NotchHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  Coins,
  CreditCard,
  Star,
  Zap,
  Gift,
  ShoppingCart,
  Crown
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { PaymentService } from "@/lib/paymentService";
import { useNavigate } from "react-router-dom";

// Import new components
import CreditPackageGrid from "@/components/credits/CreditPackageGrid";
import CreditBenefits from "@/components/credits/CreditBenefits";
import CreditFAQ from "@/components/credits/CreditFAQ";
import CreditBalanceDisplay from "@/components/credits/CreditBalanceDisplay";

// Credit package interfaces
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPopular?: boolean;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
  description: string;
  packageType: 'tournament' | 'host';
}

const Credits = () => {
  const { currentUser } = useAuth();
  const { user } = useUserProfile();
  const { hostCredits, tournamentCredits, isLoading: creditsLoading } = useCreditBalance(currentUser?.uid);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);
  const navigate = useNavigate();

  // Tournament Credit Packages (5 packages)
  const tournamentPackages: CreditPackage[] = [
    {
      id: 'starter_pack',
      name: 'Starter Pack',
      credits: 50,
      price: 50,
      features: ['50 Tournament Credits', 'Entry fee up to ₹50', 'Perfect for beginners', 'Join multiple tournaments'],
      icon: <Coins size={24} />,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      description: 'Perfect for beginners to join tournaments with entry fees up to ₹50',
      packageType: 'tournament'
    },
    {
      id: 'popular_pack',
      name: 'Popular Pack',
      credits: 150,
      price: 150,
      isPopular: true,
      features: ['150 Tournament Credits', 'Entry fee up to ₹150', 'Most chosen package', 'Great value'],
      icon: <Star size={24} />,
      gradient: 'from-gaming-accent/20 to-orange-500/20',
      description: 'Our most popular package with great value for tournament entries',
      packageType: 'tournament'
    },
    {
      id: 'pro_pack',
      name: 'Pro Pack',
      credits: 300,
      price: 300,
      features: ['300 Tournament Credits', 'Entry fee up to ₹300', 'For serious gamers', 'Great value package'],
      icon: <Crown size={24} />,
      gradient: 'from-purple-500/20 to-pink-500/20',
      description: 'For serious gamers who want to participate in higher value tournaments',
      packageType: 'tournament'
    },
    {
      id: 'elite_pack',
      name: 'Elite Pack',
      credits: 500,
      price: 500,
      features: ['500 Tournament Credits', 'Entry fee up to ₹500', 'Elite gaming level', 'Premium tournaments'],
      icon: <Zap size={24} />,
      gradient: 'from-green-500/20 to-emerald-500/20',
      description: 'Elite level access to premium tournaments with higher stakes',
      packageType: 'tournament'
    },
    {
      id: 'champion_pack',
      name: 'Champion Pack',
      credits: 900,
      price: 900,
      features: ['900 Tournament Credits', 'Entry fee up to ₹900', 'Champion level access', 'Maximum value'],
      icon: <Crown size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20',
      description: 'Maximum value package for champions who want to participate in the highest stakes tournaments',
      packageType: 'tournament'
    }
  ];

  // Host Credit Packages (5 packages)
  const hostPackages: CreditPackage[] = [
    {
      id: 'basic_host_pack',
      name: 'Basic Host Pack',
      credits: 3,
      price: 29,
      features: ['Create 3 tournaments', 'Basic host tools', 'Standard support', 'Tournament management'],
      icon: <CreditCard size={24} />,
      gradient: 'from-gaming-primary/20 to-blue-600/20',
      description: 'Start hosting with 3 tournament credits and basic hosting tools',
      packageType: 'host'
    },
    {
      id: 'standard_host_pack',
      name: 'Standard Host Pack',
      credits: 5,
      price: 45,
      features: ['Create 5 tournaments', 'Enhanced host tools', 'Priority support', 'Great for regular hosts'],
      icon: <CreditCard size={24} />,
      gradient: 'from-blue-500/20 to-indigo-600/20',
      description: 'Create 5 tournaments with enhanced hosting tools and priority support',
      packageType: 'host'
    },
    {
      id: 'premium_host_pack',
      name: 'Premium Host Pack',
      credits: 10,
      price: 85,
      isPopular: true,
      features: ['Create 10 tournaments', 'Premium host tools', 'Advanced analytics', 'Most chosen package'],
      icon: <Star size={24} />,
      gradient: 'from-purple-500/20 to-pink-600/20',
      description: 'Our most popular hosting package with premium tools and analytics',
      packageType: 'host'
    },
    {
      id: 'pro_host_pack',
      name: 'Pro Host Pack',
      credits: 20,
      price: 159,
      features: ['Create 20 tournaments', 'Pro host features', 'Detailed analytics', 'Professional hosting'],
      icon: <Crown size={24} />,
      gradient: 'from-green-500/20 to-emerald-600/20',
      description: 'Professional hosting with 20 tournament credits and detailed analytics',
      packageType: 'host'
    },
    {
      id: 'ultimate_host_pack',
      name: 'Ultimate Host Pack',
      credits: 50,
      price: 375,
      features: ['Create 50 tournaments', 'Ultimate host suite', 'Premium analytics', 'Best value package'],
      icon: <Zap size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20',
      description: 'Ultimate hosting package with 50 tournament credits and premium analytics',
      packageType: 'host'
    }
  ];

  const handlePurchase = async (packageData: CreditPackage, packageType: 'tournament' | 'host') => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
        variant: "destructive"
      });
      return;
    }

    // Check for phone number
    if (!user?.phone) {
      toast({
        title: "Phone Number Required",
        description: "Please add a phone number to your profile before making a purchase.",
        variant: "destructive",
        action: (
          <button
            onClick={() => navigate("/settings")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Go to Settings
          </button>
        ),
      });
      setIsProcessingPayment(null);
      return;
    }

    setIsProcessingPayment(packageData.id);

    try {
      // Get payment service instance
      const paymentService = PaymentService.getInstance();
      
      // Prepare payment parameters
      const paymentParams = {
        amount: packageData.price,
        userId: currentUser.uid,
        userName: user?.fullName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email || '',
        userPhone: user?.phone, // Use user's phone from profile
        paymentType: 'credit_purchase' as const,
        packageId: packageData.id,
        packageName: packageData.name,
        packageType: packageType,
        creditsAmount: packageData.credits
      };
      
      // Log the payment initiation
      console.log(`Initiating CashFree payment for ${packageData.name}:`, paymentParams);
      
      toast({
        title: "Opening Payment Gateway",
        description: "Please complete your payment in the popup window.",
      });
      
      // Use CashFree popup checkout instead of redirect
      await paymentService.initiateCashFreeCheckout(paymentParams);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg text-gaming-text">
      <NotchHeader />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-gaming-accent" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gaming-accent to-orange-500 bg-clip-text text-transparent">
              Buy Credits
            </h1>
          </div>
          <p className="text-gaming-muted text-lg">
            Purchase credits to join tournaments or host your own gaming events
          </p>
        </motion.div>

        {/* Current Balance Display */}
        <CreditBalanceDisplay 
          tournamentCredits={tournamentCredits}
          hostCredits={hostCredits}
          isLoading={creditsLoading}
          showHostCredits={user?.isHost || false}
        />

        {/* Credit Package Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <CreditPackageGrid 
            tournamentPackages={tournamentPackages}
            hostPackages={hostPackages}
            onPurchase={handlePurchase}
            processingPackageId={isProcessingPayment}
            showHostCredits={user?.isHost || false}
          />
        </motion.div>

        {/* Credit Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <CreditBenefits />
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <CreditFAQ />
        </motion.div>
      </div>
    </div>
  );
};

export default Credits; 