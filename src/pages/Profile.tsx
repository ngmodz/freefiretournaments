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
  Star,
  Loader2
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [showHostApplyDialog, setShowHostApplyDialog] = useState(false);

  const handleCreateTournamentClick = () => {
    if (user?.isHost) {
      navigate('/tournament/create');
    } else {
      setShowHostApplyDialog(true);
    }
  };

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
  const totalBalance = user?.isHost
    ? creditData.hostCredits + creditData.tournamentCredits
    : creditData.tournamentCredits;
  const totalEarnings = creditData.earnings || 0;
  const totalPurchased = (user?.isHost ? (creditData.totalPurchasedHostCredits || 0) : 0) + (creditData.totalPurchasedTournamentCredits || 0);

  // Format joined tournaments for display
  const formattedJoinedTournaments = joinedTournaments.map(tournament => {
    let startDate: Date;
    if (typeof tournament.start_date === 'string') {
      startDate = new Date(tournament.start_date);
    } else if (tournament.start_date && typeof tournament.start_date === 'object' && 'toDate' in tournament.start_date) {
      startDate = (tournament.start_date as any).toDate();
    } else {
      startDate = new Date(); // Fallback
    }
    return {
      id: tournament.id,
      title: tournament.name,
      mode: tournament.mode,
      map: tournament.map || '',
      entryFee: tournament.entry_fee,
      prizeMoney: tournament.entry_fee * tournament.max_players,
      date: startDate.toISOString(),
      time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalSpots: tournament.max_players,
      filledSpots: tournament.filled_spots || 0,
      status: tournament.status,
      ttl: tournament.ttl && typeof tournament.ttl === 'object' && 'toDate' in tournament.ttl ? (tournament.ttl as any).toDate().toISOString() : undefined
    };
  });

  // Format hosted tournaments for display
  const formattedHostedTournaments = hostedTournaments.map(tournament => {
    let startDate: Date;
    if (typeof tournament.start_date === 'string') {
      startDate = new Date(tournament.start_date);
    } else if (tournament.start_date && typeof tournament.start_date === 'object' && 'toDate' in tournament.start_date) {
      startDate = (tournament.start_date as any).toDate();
    } else {
      startDate = new Date(); // Fallback
    }
    return {
      id: tournament.id,
      title: tournament.name,
      mode: tournament.mode,
      map: tournament.map || '',
      entryFee: tournament.entry_fee,
      prizeMoney: tournament.entry_fee * tournament.max_players,
      date: startDate.toISOString(),
      time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      totalSpots: tournament.max_players,
      filledSpots: tournament.filled_spots || 0,
      status: tournament.status,
      ttl: tournament.ttl && typeof tournament.ttl === 'object' && 'toDate' in tournament.ttl ? (tournament.ttl as any).toDate().toISOString() : undefined
    };
  });

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
      className="container-padding min-h-screen overflow-hidden"
      style={{
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
        maxHeight: '100vh'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`space-y-6 max-w-4xl mx-auto py-4 ${isMobile ? 'pb-40' : 'pb-8'} overflow-auto`}
        style={{
          maxHeight: 'calc(100vh - 2rem)',
          overscrollBehavior: 'contain'
        }}
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
          <Card className="bg-gaming-card border-gaming-border shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
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
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gaming-primary/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gaming-accent/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gaming-muted">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-gaming-primary" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gaming-text">{Math.floor(totalBalance)} credits</div>
                </CardContent>
              </Card>
          <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gaming-primary/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gaming-accent/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gaming-muted">Tournaments</CardTitle>
              <Trophy className="h-4 w-4 text-gaming-accent" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gaming-text">{totalTournaments}</div>
                </CardContent>
              </Card>
          <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gaming-primary/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gaming-accent/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gaming-muted">Completed</CardTitle>
              <Award className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gaming-text">{totalCompleted}</div>
                </CardContent>
              </Card>
          {/* Earnings Card */}
          <Card className="bg-gaming-card border-gaming-border md:col-span-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gaming-primary/10 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gaming-accent/10 rounded-full -ml-8 -mb-8 blur-lg"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gaming-muted">Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-green-500">₹{Number(totalEarnings).toFixed(2)}</div>
                </CardContent>
              </Card>
        </motion.div>

        {/* Wallet Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gaming-primary" /> Wallet Details
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gaming-bg/50 rounded-lg">
                  <p className="text-sm text-gaming-muted">Host Credits</p>
                  <p className="text-xl font-bold text-gaming-primary">{Math.floor(creditData.hostCredits)} credits</p>
                  </div>
                <div className="p-4 bg-gaming-bg/50 rounded-lg">
                  <p className="text-sm text-gaming-muted">Tournament Credits</p>
                  <p className="text-xl font-bold text-gaming-accent">{Math.floor(creditData.tournamentCredits)} credits</p>
                </div>
                <div className="p-4 bg-gaming-bg/50 rounded-lg">
                  <p className="text-sm text-gaming-muted">Total Purchased</p>
                  <p className="text-xl font-bold text-gaming-text">{Math.floor(totalPurchased)} credits</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-gaming-border/50 flex justify-between items-center">
                <span className="text-lg font-semibold text-gaming-text">Available Balance</span>
                <span className="text-2xl font-bold text-white">{Math.floor(totalBalance)} credits</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tournament Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gaming-accent" /> Tournament Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <Tabs defaultValue="joined" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gaming-bg/50">
                  <TabsTrigger value="joined" className="data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg text-gaming-muted">
                    Joined ({totalJoinedTournaments})
                  </TabsTrigger>
                  <TabsTrigger value="hosted" className="data-[state=active]:bg-gaming-accent data-[state=active]:text-white data-[state=active]:shadow-lg text-gaming-muted">
                    Hosted ({totalHostedTournaments})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="joined" className="mt-4">
                  {isLoadingJoinedTournaments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
                    </div>
                  ) : formattedJoinedTournaments.length === 0 ? (
                    <div className="text-center py-8 text-gaming-muted space-y-4">
                      <Trophy size={48} className="mx-auto text-gaming-border" />
                      <p>No tournaments joined yet</p>
                      <Button onClick={() => navigate('/tournaments')} className="bg-gaming-primary hover:bg-gaming-primary/90 text-white shadow-lg">
                        Browse Tournaments
                            </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formattedJoinedTournaments.map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="hosted" className="mt-4">
                  {isLoadingHostedTournaments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gaming-accent" />
                    </div>
                  ) : formattedHostedTournaments.length === 0 ? (
                    <div className="text-center py-8 text-gaming-muted space-y-4">
                      <Trophy size={48} className="mx-auto text-gaming-border" />
                      <p>No tournaments hosted yet</p>
                      <Button onClick={handleCreateTournamentClick} className="bg-gaming-accent hover:bg-gaming-accent/90 text-white shadow-lg">
                        Create Your First Tournament
                            </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formattedHostedTournaments.map(tournament => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Host Apply Dialog */}
      <AlertDialog open={showHostApplyDialog} onOpenChange={setShowHostApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Want to host your own tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              To create a tournament, you need to be a host. Apply to become a host and start creating your own tournaments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => navigate('/apply-host')}>
              Apply as Host
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </motion.div>
    </div>
  );
};

export default Profile;
