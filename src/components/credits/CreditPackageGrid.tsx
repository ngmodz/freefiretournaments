import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreditPackageCard, { CreditPackageProps } from "./CreditPackageCard";
import { motion } from "framer-motion";

interface CreditPackageGridProps {
  tournamentPackages: Omit<CreditPackageProps, "onPurchase">[];
  hostPackages: Omit<CreditPackageProps, "onPurchase">[];
  onPurchase: (packageData: Omit<CreditPackageProps, "onPurchase">, packageType: "tournament" | "host") => void;
  processingPackageId: string | null;
}

const CreditPackageGrid: React.FC<CreditPackageGridProps> = ({
  tournamentPackages,
  hostPackages,
  onPurchase,
  processingPackageId,
}) => {
  return (
    <Tabs defaultValue="tournament" className="w-full">
      <div className="flex justify-center mb-6">
        <TabsList className="bg-gaming-bg/50 border border-gaming-border/50">
          <TabsTrigger
            value="tournament"
            className="data-[state=active]:bg-gaming-primary data-[state=active]:text-white"
          >
            Tournament Credits
          </TabsTrigger>
          <TabsTrigger
            value="host"
            className="data-[state=active]:bg-gaming-primary data-[state=active]:text-white"
          >
            Host Credits
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="tournament" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {tournamentPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <CreditPackageCard
                {...pkg}
                packageType="tournament"
                onPurchase={() => onPurchase(pkg, "tournament")}
                isProcessing={processingPackageId === pkg.id}
              />
            </motion.div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="host" className="mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {hostPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <CreditPackageCard
                {...pkg}
                packageType="host"
                onPurchase={() => onPurchase(pkg, "host")}
                isProcessing={processingPackageId === pkg.id}
              />
            </motion.div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default CreditPackageGrid; 