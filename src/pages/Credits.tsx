import { useState } from "react";
import { motion } from "framer-motion";
import NotchHeader from "@/components/NotchHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import {
  Coins,
  CreditCard,
  Star,
  Zap,
  Gift,
  ShoppingCart,
  TrendingUp,
  Crown
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CashfreeService } from "@/lib/cashfree-service";

// Credit package interfaces
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPopular?: boolean;
  isSpecialOffer?: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
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
      isSpecialOffer: true,
      offerType: 'season',
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
      isSpecialOffer: true,
      offerType: 'season',
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-gaming-accent/10 to-orange-500/10 border-gaming-accent/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="h-8 w-8 text-gaming-accent" />
                  <div>
                    <h3 className="font-semibold text-gaming-text">Tournament Credits</h3>
                    <p className="text-sm text-gaming-muted">For joining tournaments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gaming-accent">
                    {creditsLoading ? "..." : tournamentCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gaming-primary/10 to-blue-600/10 border-gaming-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-gaming-primary" />
                  <div>
                    <h3 className="font-semibold text-gaming-text">Host Credits</h3>
                    <p className="text-sm text-gaming-muted">For creating tournaments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gaming-primary">
                    {creditsLoading ? "..." : hostCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tournament Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Coins className="h-6 w-6 text-gaming-accent" />
            <h2 className="text-2xl font-bold text-gaming-text">Tournament Credits</h2>
            <Badge variant="secondary" className="bg-gaming-accent/20 text-gaming-accent">
              Join Tournaments
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tournamentPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                <Card className={`h-full bg-gradient-to-br ${pkg.gradient} border-gaming-border hover:border-gaming-accent/50 transition-all duration-300 hover:scale-105`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gaming-accent text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {pkg.isSpecialOffer && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        Limited Offer
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gaming-card rounded-full">
                        {pkg.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gaming-text">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gaming-accent">₹{pkg.price}</p>
                      <p className="text-lg font-semibold text-gaming-text">{pkg.credits} Credits</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gaming-muted">
                          <div className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg, 'tournament')}
                      disabled={isProcessingPayment === pkg.id}
                      className="w-full bg-gaming-accent hover:bg-gaming-accent/90 text-white font-semibold"
                    >
                      {isProcessingPayment === pkg.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Buy for ₹${pkg.price}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Host Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-gaming-primary" />
            <h2 className="text-2xl font-bold text-gaming-text">Host Credits</h2>
            <Badge variant="secondary" className="bg-gaming-primary/20 text-gaming-primary">
              Create Tournaments
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {hostPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <Card className={`h-full bg-gradient-to-br ${pkg.gradient} border-gaming-border hover:border-gaming-primary/50 transition-all duration-300 hover:scale-105`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gaming-primary text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {pkg.isSpecialOffer && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        Limited Offer
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gaming-card rounded-full">
                        {pkg.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gaming-text">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gaming-primary">₹{pkg.price}</p>
                      <p className="text-lg font-semibold text-gaming-text">{pkg.credits} Credits</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gaming-muted">
                          <div className="w-1.5 h-1.5 bg-gaming-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg, 'host')}
                      disabled={isProcessingPayment === pkg.id}
                      className="w-full bg-gaming-primary hover:bg-gaming-primary/90 text-white font-semibold"
                    >
                      {isProcessingPayment === pkg.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Buy for ₹${pkg.price}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Credits; 