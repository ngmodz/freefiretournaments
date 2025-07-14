import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  User, 
  Settings as SettingsIcon, 
  Trophy,
  Wallet,
  Mail, 
  MapPin, 
  BadgeInfo,
  ArrowLeft,
  Calendar,
  Shield,
  TrendingUp,
  Target,
  Award,
  Users,
  Clock,
  Star
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from "@/hooks/use-user-profile";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useTournament } from "@/contexts/TournamentContext";
import AvatarDisplay from "@/components/ui/AvatarDisplay";
import TournamentCard from "@/components/TournamentCard";

const Profile = () => {
  const { currentUser } = useAuth();
  const { user, loading } = useUserProfile();
  const creditData = useCreditBalance(currentUser?.uid);
  const { 
    hostedTournaments, 
    joinedTournaments,
    isLoadingHostedTournaments,
    isLoadingJoinedTournaments,
    refreshHostedTournaments,
    refreshJoinedTournaments
  } = useTournament();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Refresh tournament data on component mount
  useEffect(() => {
    refreshJoinedTournaments();
    refreshHostedTournaments();
  }, [refreshJoinedTournaments, refreshHostedTournaments]);

  // Calculate tournament statistics
  const totalJoinedTournaments = joinedTournaments.length;
  const totalHostedTournaments = hostedTournaments.length;
  const totalTournaments = totalJoinedTournaments + totalHostedTournaments;
  
  // Calculate completed tournaments (status === 'completed')
  const completedJoined = joinedTournaments.filter(t => t.status === 'completed').length;
  const completedHosted = hostedTournaments.filter(t => t.status === 'completed').length;
  const totalCompleted = completedJoined + completedHosted;
  
  // Calculate active tournaments (ongoing status)
  const activeJoined = joinedTournaments.filter(t => t.status === 'ongoing').length;
  const activeHosted = hostedTournaments.filter(t => t.status === 'ongoing').length;
  const totalActive = activeJoined + activeHosted;

  // Wallet details
  const totalBalance = (user?.isHost ? creditData.hostCredits : 0) + creditData.tournamentCredits;
  const totalEarnings = creditData.earnings || 0;
  const totalPurchased = (user?.isHost ? (creditData.totalPurchasedHostCredits || 0) : 0) + (creditData.totalPurchasedTournamentCredits || 0);

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

  return (
    <div 
      className="container-padding min-h-screen overflow-auto" 
      style={{ 
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`space-y-6 max-w-4xl mx-auto py-4 ${isMobile ? 'pb-24' : 'pb-8'}`}
      >
        {/* Header with back button */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center mb-6"
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-3 rounded-full bg-gaming-card hover:bg-gaming-card/80"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-white text-left">Profile</h1>
            <p className="text-gaming-muted text-sm text-left">Your personal information and activity</p>
          </div>
        </motion.div>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
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
                  {user?.isHost && (
                    <Badge variant="outline" className="bg-gaming-primary/20 text-gaming-primary border-gaming-primary/30">
                      <Shield size={12} className="mr-1" />
                      Verified Host
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
        </motion.div>

        {/* Comprehensive Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="bg-gaming-card border-gaming-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gaming-primary/20 rounded-full">
                      <Wallet className="w-5 h-5 text-gaming-primary" />
                    </div>
                    <div>
                      <p className="text-gaming-muted text-xs">Total Balance</p>
                      <p className="text-lg font-bold text-white">₹{totalBalance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Tournaments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Card className="bg-gaming-card border-gaming-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gaming-accent/20 rounded-full">
                      <Trophy className="w-5 h-5 text-gaming-accent" />
                    </div>
                    <div>
                      <p className="text-gaming-muted text-xs">Tournaments</p>
                      <p className="text-lg font-bold text-white">{totalTournaments}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-gaming-card border-gaming-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <Award className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-gaming-muted text-xs">Completed</p>
                      <p className="text-lg font-bold text-white">{totalCompleted}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Earnings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <Card className="bg-gaming-card border-gaming-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500/20 rounded-full">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-gaming-muted text-xs">Earnings</p>
                      <p className="text-lg font-bold text-white">₹{totalEarnings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Detailed Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`grid gap-4 ${user?.isHost ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                {user?.isHost && (
                  <div className="space-y-2">
                    <p className="text-gaming-muted text-sm">Host Credits</p>
                    <p className="text-2xl font-bold text-gaming-primary">₹{creditData.hostCredits}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-gaming-muted text-sm">Tournament Credits</p>
                  <p className="text-2xl font-bold text-gaming-accent">₹{creditData.tournamentCredits}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gaming-muted text-sm">Total Purchased</p>
                  <p className="text-2xl font-bold text-white">₹{totalPurchased}</p>
                </div>
              </div>
              <Separator className="bg-gaming-border" />
              <div className="flex justify-between items-center">
                <span className="text-gaming-muted">Available Balance</span>
                <span className="text-xl font-bold text-white">₹{totalBalance}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tournament Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Tournament Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="joined" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gaming-bg">
                  <TabsTrigger value="joined" className="data-[state=active]:bg-gaming-primary">
                    Joined ({totalJoinedTournaments})
                  </TabsTrigger>
                  <TabsTrigger value="hosted" className="data-[state=active]:bg-gaming-accent">
                    Hosted ({totalHostedTournaments})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="joined" className="mt-4">
                  {isLoadingJoinedTournaments ? (
                    <div className="text-center py-8">
                      <p className="text-gaming-muted">Loading joined tournaments...</p>
                    </div>
                  ) : joinedTournaments.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {joinedTournaments.slice(0, 5).map((tournament) => (
                        <Link 
                          key={tournament.id} 
                          to={`/tournament/${tournament.id}`}
                          className="block p-3 bg-gaming-bg rounded-lg border border-gaming-border hover:bg-gaming-bg/80 hover:border-gaming-primary/50 transition-colors cursor-pointer relative overflow-hidden premium-card-border backdrop-blur-sm"
                        >
                          {/* Enhanced gradient effects */}
                          <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/5 via-transparent to-gaming-accent/5"></div>
                          <div className="absolute top-0 right-0 w-28 h-28 bg-gaming-primary/10 rounded-full -mr-14 -mt-14 blur-xl animate-pulse-slow"></div>
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gaming-accent/10 rounded-full -ml-10 -mb-10 blur-xl animate-pulse-slower"></div>
                          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gaming-primary/5 rounded-full blur-xl animate-float"></div>
                          <div className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-gaming-accent/5 rounded-full blur-xl animate-float-delayed"></div>
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <h4 className="font-semibold text-white">{tournament.name}</h4>
                              <p className="text-sm text-gaming-muted">{tournament.mode} • {tournament.map}</p>
                              <p className="text-xs text-gaming-muted">
                                {(() => {
                                  const startDate = tournament.start_date;
                                  if (!startDate) return 'No date set';
                                  try {
                                    if ((startDate as any)?.toDate) {
                                      return (startDate as any).toDate().toLocaleDateString();
                                    }
                                    return new Date(startDate as string).toLocaleDateString();
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${tournament.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                                  ${tournament.status === 'ongoing' ? 'bg-gaming-primary/20 text-gaming-primary border-gaming-primary/30' : ''}
                                  ${tournament.status === 'cancelled' ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}
                                `}
                              >
                                {tournament.status}
                              </Badge>
                              <p className="text-sm text-gaming-accent mt-1">₹{tournament.entry_fee}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {joinedTournaments.length > 5 && (
                        <div className="text-center pt-2">
                          <Link to="/tournaments">
                            <Button variant="ghost" size="sm" className="text-gaming-primary">
                              View all {joinedTournaments.length} tournaments
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-gaming-muted mx-auto mb-3" />
                      <p className="text-gaming-muted mb-2">No tournaments joined yet</p>
                      <Link to="/home">
                        <Button size="sm" className="bg-gaming-primary hover:bg-gaming-primary/90">
                          Browse Tournaments
                        </Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="hosted" className="mt-4">
                  {isLoadingHostedTournaments ? (
                    <div className="text-center py-8">
                      <p className="text-gaming-muted">Loading hosted tournaments...</p>
                    </div>
                  ) : hostedTournaments.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {hostedTournaments.slice(0, 5).map((tournament) => (
                        <Link 
                          key={tournament.id} 
                          to={`/tournament/${tournament.id}`}
                          className="block p-3 bg-gaming-bg rounded-lg border border-gaming-border hover:bg-gaming-bg/80 hover:border-gaming-accent/50 transition-colors cursor-pointer relative overflow-hidden premium-card-border backdrop-blur-sm"
                        >
                          {/* Enhanced gradient effects */}
                          <div className="absolute inset-0 bg-gradient-to-br from-gaming-primary/5 via-transparent to-gaming-accent/5"></div>
                          <div className="absolute top-0 right-0 w-28 h-28 bg-gaming-primary/10 rounded-full -mr-14 -mt-14 blur-xl animate-pulse-slow"></div>
                          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gaming-accent/10 rounded-full -ml-10 -mb-10 blur-xl animate-pulse-slower"></div>
                          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-gaming-primary/5 rounded-full blur-xl animate-float"></div>
                          <div className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-gaming-accent/5 rounded-full blur-xl animate-float-delayed"></div>
                          
                          <div className="flex justify-between items-start relative z-10">
                            <div>
                              <h4 className="font-semibold text-white">{tournament.name}</h4>
                              <p className="text-sm text-gaming-muted">{tournament.mode} • {tournament.map}</p>
                              <p className="text-xs text-gaming-muted">
                                {(() => {
                                  const startDate = tournament.start_date;
                                  if (!startDate) return 'No date set';
                                  try {
                                    if ((startDate as any)?.toDate) {
                                      return (startDate as any).toDate().toLocaleDateString();
                                    }
                                    return new Date(startDate as string).toLocaleDateString();
                                  } catch {
                                    return 'Invalid date';
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant="outline" 
                                className={`
                                  ${tournament.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                                  ${tournament.status === 'ongoing' ? 'bg-gaming-accent/20 text-gaming-accent border-gaming-accent/30' : ''}
                                  ${tournament.status === 'cancelled' ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}
                                `}
                              >
                                {tournament.status}
                              </Badge>
                              <p className="text-sm text-gaming-accent mt-1">{tournament.max_players} players</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                      {hostedTournaments.length > 5 && (
                        <div className="text-center pt-2">
                          <Link to="/tournaments">
                            <Button variant="ghost" size="sm" className="text-gaming-accent">
                              View all {hostedTournaments.length} tournaments
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gaming-muted mx-auto mb-3" />
                      <p className="text-gaming-muted mb-2">No tournaments hosted yet</p>
                      <Link to="/tournament/create">
                        <Button size="sm" className="bg-gaming-accent hover:bg-gaming-accent/90">
                          Create Tournament
                        </Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Link to="/wallet" className="block">
            <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Wallet className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Wallet</p>
                <p className="text-xs text-gaming-muted">Manage funds</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/tournaments" className="block">
            <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-gaming-accent mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Tournaments</p>
                <p className="text-xs text-gaming-muted">View all</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/tournament/create" className="block">
            <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-gaming-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Create</p>
                <p className="text-xs text-gaming-muted">New tournament</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/buy-credits" className="block">
            <Card className="bg-gaming-card border-gaming-border hover:bg-gaming-card/80 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Buy Credits</p>
                <p className="text-xs text-gaming-muted">Add funds</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link to="/tournaments" className="flex-1 sm:flex-none max-w-xs">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                className="w-full bg-gaming-primary hover:bg-gaming-primary/90 text-white font-medium py-2 px-6 rounded-md flex items-center justify-center gap-2 shadow-sm"
              >
                <Trophy size={16} />
                View Tournaments
              </Button>
            </motion.div>
          </Link>

          {/* Host Actions - Conditional based on isHost status */}
          {user?.isHost ? (
            <Link to="/tournament/create" className="flex-1 sm:flex-none max-w-xs">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  className="w-full bg-gaming-accent hover:bg-gaming-accent/90 text-white font-medium py-2 px-6 rounded-md flex items-center justify-center gap-2 shadow-sm"
                >
                  <Shield size={16} />
                  Create Tournament
                </Button>
              </motion.div>
            </Link>
          ) : (
            <Link to="/apply-host" className="flex-1 sm:flex-none max-w-xs">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  variant="outline"
                  className="w-full border-gaming-primary text-gaming-primary hover:bg-gaming-primary hover:text-white font-medium py-2 px-6 rounded-md flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Shield size={16} />
                  Apply to be Host
                </Button>
              </motion.div>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Profile;
