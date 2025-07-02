import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Zap, Crown, Star } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { BuyCreditsButton } from '@/components/payment';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Example component demonstrating payment integration
 * This component shows different ways to use the BuyCreditsButton component
 */
const BuyCreditsExample: React.FC = () => {
  const { currentUser } = useAuth();

  // Example credit packages
  const creditPackages = [
    {
      id: 'starter_package',
      name: 'Starter Package',
      credits: 50,
      price: 50,
      type: 'tournament' as const,
      icon: <ShoppingCart className="h-5 w-5 text-blue-500" />
    },
    {
      id: 'popular_package',
      name: 'Popular Package',
      credits: 150,
      price: 150,
      type: 'tournament' as const,
      icon: <Star className="h-5 w-5 text-orange-500" />
    },
    {
      id: 'pro_package',
      name: 'Pro Package',
      credits: 300,
      price: 300,
      type: 'tournament' as const,
      icon: <Crown className="h-5 w-5 text-purple-500" />
    }
  ];

  // Example host packages
  const hostPackages = [
    {
      id: 'basic_host_package',
      name: 'Basic Host Package',
      credits: 3,
      price: 29,
      type: 'host' as const,
      icon: <Zap className="h-5 w-5 text-green-500" />
    }
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Buy Credits Example</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Simple button example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Simple Button Example</CardTitle>
            <CardDescription>
              Basic button that redirects to the credits page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This is the simplest usage of the BuyCreditsButton component. It just redirects to the credits page.
            </p>
          </CardContent>
          <CardFooter>
            <BuyCreditsButton />
          </CardFooter>
        </Card>

        {/* Direct purchase example */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Direct Purchase Example</CardTitle>
            <CardDescription>
              Button that directly initiates a payment for a specific package
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-blue-800">Starter Package</h3>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-blue-600">50 Credits</span>
                <span className="font-bold">₹50</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              This button directly initiates a payment for the Starter Package without navigating to the credits page.
            </p>
          </CardContent>
          <CardFooter>
            <BuyCreditsButton 
              directPurchase={true}
              packageId="starter_package"
              packageName="Starter Package"
              packageType="tournament"
              amount={50}
              creditsAmount={50}
              label="Buy 50 Credits"
              disabled={!currentUser}
              className="w-full"
            />
          </CardFooter>
        </Card>
      </div>

      {/* Multiple packages example */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Multiple Packages Example</CardTitle>
          <CardDescription>
            Choose from different credit packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tournament">
            <TabsList className="mb-4">
              <TabsTrigger value="tournament">Tournament Credits</TabsTrigger>
              <TabsTrigger value="host">Host Credits</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tournament">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {creditPackages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {pkg.icon}
                      <h3 className="font-semibold">{pkg.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">{pkg.credits} Credits</span>
                      <span className="font-bold">₹{pkg.price}</span>
                    </div>
                    <BuyCreditsButton 
                      directPurchase={true}
                      packageId={pkg.id}
                      packageName={pkg.name}
                      packageType={pkg.type}
                      amount={pkg.price}
                      creditsAmount={pkg.credits}
                      label={`Buy Now`}
                      disabled={!currentUser}
                      className="w-full"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="host">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {hostPackages.map(pkg => (
                  <div key={pkg.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {pkg.icon}
                      <h3 className="font-semibold">{pkg.name}</h3>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-600">{pkg.credits} Credits</span>
                      <span className="font-bold">₹{pkg.price}</span>
                    </div>
                    <BuyCreditsButton 
                      directPurchase={true}
                      packageId={pkg.id}
                      packageName={pkg.name}
                      packageType={pkg.type}
                      amount={pkg.price}
                      creditsAmount={pkg.credits}
                      label={`Buy Now`}
                      disabled={!currentUser}
                      className="w-full"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Implementation notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>The <code>BuyCreditsButton</code> component can be used in two modes:
              <ul className="list-disc pl-5 mt-2">
                <li>Simple redirect to credits page (default)</li>
                <li>Direct purchase with <code>directPurchase={true}</code> and required parameters</li>
              </ul>
            </li>
            <li>For direct purchases, you need to provide:
              <ul className="list-disc pl-5 mt-2">
                <li><code>packageId</code>: Unique identifier for the package</li>
                <li><code>packageName</code>: Display name of the package</li>
                <li><code>packageType</code>: Either 'tournament' or 'host'</li>
                <li><code>amount</code>: Price in rupees</li>
                <li><code>creditsAmount</code>: Number of credits to purchase</li>
              </ul>
            </li>
            <li>The button will handle:
              <ul className="list-disc pl-5 mt-2">
                <li>User authentication checks</li>
                <li>Payment form redirection</li>
                <li>Loading states during processing</li>
              </ul>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyCreditsExample; 