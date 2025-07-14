import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Users, Trophy, Clock, Star, Gamepad2, MessageSquare, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ApplyHost = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    experience: '',
    reason: '',
    preferredGameModes: '',
    availability: '',
    contactInfo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a host application.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.experience || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit application to Firestore
      await addDoc(collection(db, 'hostApplications'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        ...formData,
        status: 'pending',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: ''
      });

      toast({
        title: "Application Submitted!",
        description: "Your host application has been submitted successfully. You'll be notified once it's reviewed.",
        variant: "default"
      });

      // Navigate back to profile or home
      navigate('/profile');

    } catch (error) {
      console.error('Error submitting host application:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg text-white">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center items-start">
          <Link to="/profile" className="mr-4">
            <Button variant="ghost" size="icon" className="rounded-full bg-gaming-card hover:bg-gaming-card/80 transition-colors">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div className="w-full">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gaming-primary to-gaming-accent bg-clip-text text-transparent text-left">
              Become a Host
            </h1>
            <p className="text-gaming-muted text-left">Join our community of verified tournament organizers.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Application Form */}
            <div className="lg:col-span-2">
              <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg border-gaming-border shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-white flex items-center text-2xl">
                    <Shield className="mr-3 text-gaming-primary" size={24} />
                    Host Application
                  </CardTitle>
                  <CardDescription className="text-gaming-muted pt-1">
                    Tell us why you'd be a great tournament host. Fields marked with * are required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section: Experience */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Star className="mr-2 text-gaming-accent" size={18} />
                        Your Experience
                      </h3>
                      <div>
                        <Label htmlFor="experience" className="text-base font-medium text-gray-300">
                          Gaming & Hosting Experience *
                        </Label>
                        <Textarea
                          id="experience"
                          name="experience"
                          placeholder="Describe your Free Fire experience, any past hosting roles, and achievements..."
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="mt-2 bg-zinc-900/50 border-zinc-700 text-white focus:border-gaming-primary focus:ring-gaming-primary/50 focus:ring-1 transition-all duration-300"
                          rows={5}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason" className="text-base font-medium text-gray-300">
                          Motivation to Host *
                        </Label>
                        <Textarea
                          id="reason"
                          name="reason"
                          placeholder="What motivates you to host tournaments for the community?"
                          value={formData.reason}
                          onChange={handleInputChange}
                          className="mt-2 bg-zinc-900/50 border-zinc-700 text-white focus:border-gaming-primary focus:ring-gaming-primary/50 focus:ring-1 transition-all duration-300"
                          rows={5}
                          required
                        />
                      </div>
                    </div>

                    {/* Section: Logistics */}
                    <div className="space-y-4">
                       <h3 className="text-lg font-semibold text-white flex items-center">
                        <Gamepad2 className="mr-2 text-gaming-accent" size={18} />
                        Hosting Details
                      </h3>
                      <div>
                        <Label htmlFor="preferredGameModes" className="text-base font-medium text-gray-300">
                          Preferred Game Modes
                        </Label>
                        <Input
                          id="preferredGameModes"
                          name="preferredGameModes"
                          placeholder="e.g., Solo, Duo, Squad, Clash Squad"
                          value={formData.preferredGameModes}
                          onChange={handleInputChange}
                          className="mt-2 bg-zinc-900/50 border-zinc-700 text-white focus:border-gaming-primary focus:ring-gaming-primary/50 focus:ring-1 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="availability" className="text-base font-medium text-gray-300">
                          Availability
                        </Label>
                        <Input
                          id="availability"
                          name="availability"
                          placeholder="e.g., Weekends, Evenings from 7-10 PM"
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="mt-2 bg-zinc-900/50 border-zinc-700 text-white focus:border-gaming-primary focus:ring-gaming-primary/50 focus:ring-1 transition-all duration-300"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactInfo" className="text-base font-medium text-gray-300">
                          Contact Info (Optional)
                        </Label>
                        <Input
                          id="contactInfo"
                          name="contactInfo"
                          placeholder="Discord, WhatsApp, etc."
                          value={formData.contactInfo}
                          onChange={handleInputChange}
                          className="mt-2 bg-zinc-900/50 border-zinc-700 text-white focus:border-gaming-primary focus:ring-gaming-primary/50 focus:ring-1 transition-all duration-300"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full btn-gaming-primary text-base"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg border-gaming-border shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gaming-primary text-xl">Host Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 relative z-10">
                  <div className="flex items-start space-x-4">
                    <Trophy className="text-gaming-accent mt-1" size={22} />
                    <div>
                      <p className="text-white font-semibold">Create & Manage Tournaments</p>
                      <p className="text-gaming-muted text-sm">Get access to our host panel to create and manage your own events.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Users className="text-gaming-accent mt-1" size={22} />
                    <div>
                      <p className="text-white font-semibold">Build Your Community</p>
                      <p className="text-gaming-muted text-sm">Grow your audience and establish yourself as a key community figure.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Shield className="text-gaming-accent mt-1" size={22} />
                    <div>
                      <p className="text-white font-semibold">Verified Host Badge</p>
                      <p className="text-gaming-muted text-sm">Gain a verified badge on your profile to signify your trusted status.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg border-gaming-border shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-gaming-primary text-xl">Application Process</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm relative z-10">
                   <div className="flex items-center space-x-3">
                    <div className="bg-gaming-primary/20 rounded-full p-2">
                      <MessageSquare className="text-gaming-primary" size={18} />
                    </div>
                    <p className="text-gray-300"><span className="font-semibold text-white">1. Submit Application:</span> Fill out this form with your details.</p>
                  </div>
                   <div className="flex items-center space-x-3">
                    <div className="bg-gaming-primary/20 rounded-full p-2">
                     <Clock className="text-gaming-primary" size={18} />
                    </div>
                    <p className="text-gray-300"><span className="font-semibold text-white">2. Team Review:</span> Our team will review your application within 3-5 days.</p>
                  </div>
                   <div className="flex items-center space-x-3">
                    <div className="bg-gaming-primary/20 rounded-full p-2">
                     <Calendar className="text-gaming-primary" size={18} />
                    </div>
                    <p className="text-gray-300"><span className="font-semibold text-white">3. Onboarding:</span> If approved, we'll guide you through the setup process.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyHost;
