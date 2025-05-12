import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { User, Edit, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import ProfileTabs from "@/components/profile/ProfileTabs";
import WalletSection from "@/components/profile/WalletSection";
import AchievementsSection from "@/components/profile/AchievementsSection";
import LogoutButton from "@/components/profile/LogoutButton";
import PersonalInfoSection from "@/components/profile/PersonalInfoSection";

const Profile = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Filter tournaments by status
  const filterTournaments = (tournaments: any[], filter: string | null) => {
    if (!filter) return tournaments;
    return tournaments.filter(t => t.status === filter);
  };

  // Search tournaments by title
  const searchTournaments = (tournaments: any[], query: string) => {
    if (!query.trim()) return tournaments;
    const lowercasedQuery = query.toLowerCase();
    return tournaments.filter(t => 
      t.title?.toLowerCase().includes(lowercasedQuery) || 
      t.name?.toLowerCase().includes(lowercasedQuery)
    );
  };

  // Combined filter and search
  const getFilteredTournaments = (tournaments: any[]) => {
    return searchTournaments(
      filterTournaments(tournaments, activeFilter),
      searchQuery
    );
  };

  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter === activeFilter ? null : filter);
  };

  return (
    <div className="container-padding py-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Personal Information Card - Now using our new component */}
        <PersonalInfoSection />

        {/* Tournament Activity */}
        <ProfileTabs 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          handleFilterChange={handleFilterChange}
          getFilteredTournaments={getFilteredTournaments}
        />

        {/* Wallet Section */}
        <WalletSection />

        {/* Achievements Section */}
        <AchievementsSection />

        {/* Logout Button - We'll keep this in the main Profile page for now */}
        <div className="flex justify-center sm:justify-start">
          <LogoutButton />
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
