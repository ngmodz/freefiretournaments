import { useState } from "react";
import { motion } from "framer-motion";
import NotchHeader from "@/components/NotchHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
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
import { CashfreeService } from "@/lib/cashfree-service";

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
}

const Credits = () => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading: creditsLoading } = useCreditBalance(currentUser?.uid);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  // Tournament Credit Packages (5 packages)
  const tournamentPackages: CreditPackage[] = [
    {
      id: 'starter_pack',
      name: 'Starter Pack',
      credits: 50,
      price: 50,
      features: ['50 Tournament Credits', 'Entry fee up to ₹50', 'Perfect for beginners', 'Join multiple tournaments'],
      icon: <Coins size={24} />,
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'popular_pack',
      name: 'Popular Pack',
      credits: 150,
      price: 150,
      isPopular: true,
      features: ['150 Tournament Credits', 'Entry fee up to ₹150', 'Most chosen package', 'Great value'],
      icon: <Star size={24} />,
      gradient: 'from-gaming-accent/20 to-orange-500/20'
    },
    {
      id: 'pro_pack',
      name: 'Pro Pack',
      credits: 300,
      price: 300,
      features: ['300 Tournament Credits', 'Entry fee up to ₹300', 'For serious gamers', 'Great value package'],
      icon: <Crown size={24} />,
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'elite_pack',
      name: 'Elite Pack',
      credits: 500,
      price: 500,
      features: ['500 Tournament Credits', 'Entry fee up to ₹500', 'Elite gaming level', 'Premium tournaments'],
      icon: <Zap size={24} />,
      gradient: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'champion_pack',
      name: 'Champion Pack',
      credits: 900,
      price: 900,
      features: ['900 Tournament Credits', 'Entry fee up to ₹900', 'Champion level access', 'Maximum value'],
      icon: <Crown size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20'
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
      gradient: 'from-gaming-primary/20 to-blue-600/20'
    },
    {
      id: 'standard_host_pack',
      name: 'Standard Host Pack',
      credits: 5,
      price: 45,
      features: ['Create 5 tournaments', 'Enhanced host tools', 'Priority support', 'Great for regular hosts'],
      icon: <CreditCard size={24} />,
      gradient: 'from-blue-500/20 to-indigo-600/20'
    },
    {
      id: 'premium_host_pack',
      name: 'Premium Host Pack',
      credits: 10,
      price: 85,
      isPopular: true,
      features: ['Create 10 tournaments', 'Premium host tools', 'Advanced analytics', 'Most chosen package'],
      icon: <Star size={24} />,
      gradient: 'from-purple-500/20 to-pink-600/20'
    },
    {
      id: 'pro_host_pack',
      name: 'Pro Host Pack',
      credits: 20,
      price: 159,
      features: ['Create 20 tournaments', 'Pro host features', 'Detailed analytics', 'Professional hosting'],
      icon: <Crown size={24} />,
      gradient: 'from-green-500/20 to-emerald-600/20'
    },
    {
      id: 'ultimate_host_pack',
      name: 'Ultimate Host Pack',
      credits: 50,
      price: 375,
      features: ['Create 50 tournaments', 'Ultimate host suite', 'Premium analytics', 'Best value package'],
      icon: <Zap size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20'
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

    setIsProcessingPayment(packageData.id);

    try {
      const cashfreeService = new CashfreeService();

      // Prepare payment parameters
      const paymentParams = {
        orderAmount: packageData.price,
        customerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        customerEmail: currentUser.email || 'user@example.com',
        customerPhone: currentUser.phoneNumber || '9999999999',
        orderNote: `${packageType === 'host' ? 'Host' : 'Tournament'} Credits - ${packageData.name}`,
        userId: currentUser.uid,
        packageId: packageData.id,
        packageType: packageType,
        creditsAmount: packageData.credits
      };

      console.log(`Initiating payment for ${packageData.name}:`, paymentParams);

      // Create payment order
      const response = await cashfreeService.createPaymentOrder(paymentParams);

      if (!response.success || !response.order_token) {
        throw new Error(response.error || 'Failed to create payment order');
      }

      // Initialize Cashfree checkout
      await cashfreeService.initializeDropIn(response.order_token, {
        onSuccess: (data: any) => {
          console.log('Payment successful:', data);
          toast({
            title: "Payment Successful!",
            description: `${packageData.credits} ${packageType} credits will be added to your account shortly.`,
          });
        },
        onFailure: (data: any) => {
          console.log('Payment failed:', data);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive"
          });
        }
      });

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
          />
        </motion.div>

        {/* Credit Benefits Section */}
        <CreditBenefits />

        {/* FAQ Section */}
        <CreditFAQ />
      </div>
    </div>
  );
};

export default Credits; 