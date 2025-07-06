import { motion } from "framer-motion";
import { 
  User, 
  Settings as SettingsIcon, 
  Trophy,
  Wallet,
  Mail, 
  MapPin, 
  BadgeInfo,
  ArrowLeft,
  Edit,
  Calendar,
  Shield
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from "@/hooks/use-user-profile";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import AvatarDisplay from "@/components/ui/AvatarDisplay";

const Profile = () => {
  const { currentUser } = useAuth();
  const { user, loading } = useUserProfile();
  const creditData = useCreditBalance(currentUser?.uid);
  const navigate = useNavigate();

  if (loading && !user) {
    return (
      <div className="container-padding py-4 min-h-screen">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-pulse space-y-4">
            <div className="bg-gray-700 h-8 w-32 rounded"></div>
            <div className="bg-gray-700 h-6 w-48 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const joinDate = currentUser?.metadata?.creationTime 
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : 'Unknown';

  const totalBalance = creditData.hostCredits + creditData.tournamentCredits;

  return (
    <div className="container-padding py-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 rounded-full bg-gaming-card hover:bg-gaming-card/80"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Profile</h1>
              <p className="text-gaming-muted text-sm">Your personal information and activity</p>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline" className="border-gaming-primary/30">
              <SettingsIcon size={16} className="mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Main Profile Card */}
        <Card className="bg-gaming-card border-gaming-border shadow-xl">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-4">
                <AvatarDisplay 
                  userProfile={user}
                  currentUser={currentUser}
                  size="xl" 
                />
                
                <div className="flex flex-wrap justify-center gap-2">
                  {user?.isPremium && (
                    <Badge variant="outline" className="bg-gaming-primary/20 text-gaming-primary border-gaming-primary/30">
                      <Shield size={12} className="mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="flex-1 space-y-6 text-center lg:text-left">
                {/* Primary Information */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {user?.fullName || "Anonymous Player"}
                    </h2>
                    {user?.ign && (
                      <div className="flex items-center justify-center lg:justify-start text-gaming-accent">
                        <BadgeInfo className="w-5 h-5 mr-2" />
                        <span className="text-lg font-semibold">IGN: {user.ign}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center lg:justify-start text-gaming-text">
                      <Mail className="w-4 h-4 mr-3 text-gaming-muted" />
                      <span>{user?.email || currentUser?.email || "No email"}</span>
                    </div>
                    
                    {user?.uid && (
                      <div className="flex items-center justify-center lg:justify-start text-gaming-text">
                        <User className="w-4 h-4 mr-3 text-gaming-muted" />
                        <span className="font-mono text-sm">UID: {user.uid}</span>
                      </div>
                    )}

                    {user?.location && (
                      <div className="flex items-center justify-center lg:justify-start text-gaming-text">
                        <MapPin className="w-4 h-4 mr-3 text-gaming-muted" />
                        <span>{user.location}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-center lg:justify-start text-gaming-text">
                      <Calendar className="w-4 h-4 mr-3 text-gaming-muted" />
                      <span>Joined {joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            {user?.bio && (
              <>
                <Separator className="my-8 bg-gaming-border" />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">About</h3>
                  <p className="text-gaming-text leading-relaxed">{user.bio}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credit Balance */}
          <Card className="bg-gaming-card border-gaming-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gaming-primary/20 rounded-full">
                  <Wallet className="w-6 h-6 text-gaming-primary" />
                </div>
                <div>
                  <p className="text-gaming-muted text-sm">Credit Balance</p>
                  <p className="text-2xl font-bold text-white">₹{totalBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournaments Link */}
          <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer">
            <Link to="/tournaments">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gaming-accent/20 rounded-full">
                    <Trophy className="w-6 h-6 text-gaming-accent" />
                  </div>
                  <div>
                    <p className="text-gaming-muted text-sm">My Tournaments</p>
                    <p className="text-lg font-semibold text-white">View All</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Wallet Link */}
          <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer">
            <Link to="/wallet">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <Wallet className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-gaming-muted text-sm">Wallet</p>
                    <p className="text-lg font-semibold text-white">Manage</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/settings" className="flex-1 sm:flex-none">
            <Button className="w-full bg-gaming-primary hover:bg-gaming-primary/90 flex items-center justify-center gap-2">
              <Edit size={16} />
              Edit Profile
            </Button>
          </Link>
          <Link to="/tournaments" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full border-gaming-border hover:bg-gaming-card flex items-center justify-center gap-2">
              <Trophy size={16} />
              View Tournaments
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
