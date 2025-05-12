import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, PlusCircle, MinusCircle, ArrowDown, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Mock wallet data - would come from Firebase in the future
const mockWalletData = {
  balance: 1250,
  transactions: [
    { id: "t1", type: "deposit", amount: 500, date: "2023-05-15", status: "completed" },
    { id: "t2", type: "withdrawal", amount: 200, date: "2023-05-10", status: "completed" },
    { id: "t3", type: "prize", amount: 750, date: "2023-05-05", status: "completed" },
    { id: "t4", type: "entry_fee", amount: 100, date: "2023-05-01", status: "completed" },
  ]
};

const WalletSection = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'actions'>('transactions');
  
  return (
    <Card className="bg-[#1F2937] border-gaming-border">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Wallet size={20} className="text-gaming-primary" />
          Wallet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Balance Display */}
        <div className="mb-6">
          <div className="bg-[#111827] rounded-lg p-4 flex flex-col items-center">
            <p className="text-[#A0AEC0] mb-1">Current Balance</p>
            <h2 className="text-4xl font-bold text-[#22C55E]">₹{mockWalletData.balance}</h2>
            <div className="flex gap-3 mt-4">
              <Button 
                size="sm" 
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 flex items-center gap-1.5"
              >
                <PlusCircle size={16} />
                Add Funds
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-gaming-border text-white hover:bg-[#111827]/50 flex items-center gap-1.5"
              >
                <MinusCircle size={16} />
                Withdraw
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mb-4 border-b border-gaming-border">
          <button
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "py-2 px-4 text-sm font-medium",
              activeTab === 'transactions' 
                ? "border-b-2 border-gaming-primary text-white" 
                : "text-[#A0AEC0] hover:text-white"
            )}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={cn(
              "py-2 px-4 text-sm font-medium",
              activeTab === 'actions' 
                ? "border-b-2 border-gaming-primary text-white" 
                : "text-[#A0AEC0] hover:text-white"
            )}
          >
            Actions
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'transactions' ? (
          <div className="space-y-3">
            {mockWalletData.transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111827] rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    transaction.type === 'deposit' || transaction.type === 'prize' 
                      ? "bg-[#22C55E]/20" 
                      : "bg-[#EF4444]/20"
                  )}>
                    {transaction.type === 'deposit' || transaction.type === 'prize' ? (
                      <ArrowDown size={16} className="text-[#22C55E]" />
                    ) : (
                      <ArrowUp size={16} className="text-[#EF4444]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {transaction.type === 'deposit' && "Added Funds"}
                      {transaction.type === 'withdrawal' && "Withdrawal"}
                      {transaction.type === 'prize' && "Tournament Prize"}
                      {transaction.type === 'entry_fee' && "Tournament Entry Fee"}
                    </p>
                    <p className="text-xs text-[#A0AEC0]">{transaction.date}</p>
                  </div>
                </div>
                <div className={cn(
                  "text-sm font-bold",
                  transaction.type === 'deposit' || transaction.type === 'prize' 
                    ? "text-[#22C55E]" 
                    : "text-[#EF4444]"
                )}>
                  {transaction.type === 'deposit' || transaction.type === 'prize' 
                    ? `+₹${transaction.amount}` 
                    : `-₹${transaction.amount}`}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#111827] rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Add Funds</h3>
              <p className="text-sm text-[#A0AEC0] mb-3">
                Add funds to your wallet using UPI, credit card, or other payment methods
              </p>
              <Button className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90">Add Funds</Button>
            </div>
            
            <div className="bg-[#111827] rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Withdraw</h3>
              <p className="text-sm text-[#A0AEC0] mb-3">
                Withdraw your funds to your bank account or UPI ID
              </p>
              <Button variant="outline" className="w-full border-gaming-border text-white hover:bg-[#111827]/50">
                Withdraw Funds
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletSection;
