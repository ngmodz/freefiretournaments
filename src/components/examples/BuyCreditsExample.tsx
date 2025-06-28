import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { PaymentService } from '@/lib/paymentService';

/**
 * Example component demonstrating how to integrate with Cashfree Payment Forms
 * This component shows a simple credit package with a buy button
 */
const BuyCreditsExample: React.FC = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Example credit package
  const creditPackage = {
    id: 'example_package',
    name: 'Example Package',
    credits: 100,
    price: 99,
    type: 'tournament' as const
  };

  const handleBuyCredits = async () => {
    if (!currentUser) {
      alert('Please log in to purchase credits');
      return;
    }

    setIsLoading(true);
    try {
      // Get payment service instance
      const paymentService = PaymentService.getInstance();
      
      // Prepare payment parameters
      const paymentParams = {
        amount: creditPackage.price,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email || '',
        paymentType: 'credit_purchase' as const,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        packageType: creditPackage.type,
        creditsAmount: creditPackage.credits
      };
      
      console.log('Initiating payment with params:', paymentParams);
      
      // Redirect to payment form
      paymentService.redirectToPaymentForm(paymentParams);
      
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred while processing your payment. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Buy Credits Example</CardTitle>
        <CardDescription>
          This is an example component showing how to integrate with Cashfree Payment Forms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">{creditPackage.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <span className="text-blue-600">{creditPackage.credits} Credits</span>
              <span className="font-bold">₹{creditPackage.price}</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>This example demonstrates how to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Create payment parameters</li>
              <li>Use the PaymentService to redirect to Cashfree Payment Form</li>
              <li>Handle the payment flow</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBuyCredits} 
          disabled={isLoading || !currentUser}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Buy {creditPackage.credits} Credits
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BuyCreditsExample; 