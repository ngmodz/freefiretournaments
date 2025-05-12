import { ArrowLeft, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import TableOfContents from "@/components/policy/TableOfContents";
import PolicySection from "@/components/policy/PolicySection";
import PolicySubsection from "@/components/policy/PolicySubsection";

const TermsAndPolicy = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("section-1");
  const [isMobile, setIsMobile] = useState(false);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // Table of contents items
  const tocItems = [
    { id: "section-1", title: "General Terms of Use" },
    { id: "section-2", title: "Tournament Policies" },
    { id: "section-3", title: "Payment and Wallet" },
    { id: "section-4", title: "Privacy Policy" },
    { id: "section-5", title: "Intellectual Property" },
    { id: "section-6", title: "Limitation of Liability" },
    { id: "section-7", title: "Termination" },
    { id: "section-8", title: "Modifications to Terms" },
    { id: "section-9", title: "Governing Law" },
    { id: "section-10", title: "Contact Us" }
  ];

  // Handle scrolling to sections
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Adjust based on your header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  // Track scroll position to update active TOC item
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const sections = contentRef.current.querySelectorAll("h2[id]");
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id);
          }
        });
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-gaming-bg">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-gaming-bg/95 backdrop-blur-md border-b border-gaming-border shadow-lg px-4 py-3 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gaming-text/70 hover:text-gaming-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-gaming-primary mx-auto pr-10">Terms and Policy</h1>
      </div>
      
      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Mobile or Desktop TOC */}
          <TableOfContents
            items={tocItems}
            activeSection={activeSection}
            onSectionClick={scrollToSection}
            isMobile={isMobile}
          />

          {/* Main content */}
          <div 
            ref={contentRef}
            className="flex-1 prose prose-invert prose-gaming max-w-none lg:max-w-4xl"
          >
            <div className="mb-8">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gaming-card p-6 rounded-lg shadow-md border border-gaming-border/30"
              >
                <h1 className="text-3xl font-bold text-gaming-primary mb-3">Terms and Policy for Freefire Tournaments</h1>
                <p className="text-sm text-gaming-text/70 mb-6">Last Updated: May 1, 2025</p>
                
                <div className="p-4 bg-gaming-card/50 border border-gaming-border/10 rounded-md mb-6">
                  <p className="text-gaming-text/90">
                    Welcome to <strong className="text-gaming-primary">Freefire Tournaments</strong>, a Progressive Web App (PWA) designed to host and manage Free Fire tournaments. By accessing or using our platform, you agree to be bound by these Terms and Policy ("Terms"). If you do not agree, please do not use the app. These Terms govern your use of the app, including features such as tournament creation, participation, payments, and user interactions.
                  </p>
                </div>
              </motion.div>
            </div>
            
            {/* Section 1: General Terms of Use */}
            <PolicySection id="section-1" title="1. General Terms of Use">
              <PolicySubsection title="1.1 Eligibility">
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must be at least 13 years old to use Freefire Tournaments. If you are under 18, you must have parental or guardian consent.</li>
                  <li>You must provide accurate and complete information during registration, including your Free Fire In-Game Name (IGN) and email address.</li>
                  <li>Accounts are non-transferable and may not be shared.</li>
                </ul>
              </PolicySubsection>
                
              <PolicySubsection title="1.2 Account Responsibilities">
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are responsible for maintaining the confidentiality of your account credentials (email, password, etc.).</li>
                  <li>You are liable for all activities conducted through your account.</li>
                </ul>
              </PolicySubsection>
                
              <PolicySubsection title="1.3 Acceptable Use">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the app only for lawful purposes and in accordance with these Terms.</li>
                  <li>Do not engage in:
                    <ul className="list-disc pl-6 space-y-1 mt-2">
                      <li>Cheating, hacking, or exploiting bugs in Free Fire or the app.</li>
                      <li>Sharing custom room details (Room ID/password) publicly or with non-participants.</li>
                      <li>Posting offensive, defamatory, or illegal content in chats, descriptions, or profiles.</li>
                      <li>Attempting to disrupt the app's functionality (e.g., DDoS attacks, unauthorized access).</li>
                    </ul>
                  </li>
                  <li>Violation of these rules may result in account suspension or termination.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>
              
            {/* Section 2: Tournament Policies */}
            <PolicySection id="section-2" title="2. Tournament Policies">
              <PolicySubsection title="2.1 Tournament Creation">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Hosts must provide accurate tournament details, including game mode, entry fees, prize distribution, and custom room settings.</li>
                  <li>Hosts are responsible for enforcing the tournament rules they establish.</li>
                  <li>Freefire Tournaments reserves the right to remove tournaments that violate our guidelines or appear fraudulent.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="2.2 Tournament Participation">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Participants must follow all tournament rules specified by the host.</li>
                  <li>Players must join tournament rooms at the designated time or risk forfeiture.</li>
                  <li>Entry fees are non-refundable unless the tournament is cancelled by the host or Freefire Tournaments.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="2.3 Prize Distribution">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Prizes will be distributed as specified in the tournament details.</li>
                  <li>Prize money will be credited to winners' wallets within 24 hours of tournament completion.</li>
                  <li>Freefire Tournaments reserves the right to withhold prizes in cases of rule violations, cheating, or disputes.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>
            
            {/* Render other sections similarly */}
            <PolicySection id="section-10" title="10. Contact Us">
              <div className="p-6 bg-gaming-card/50 rounded-lg border border-gaming-border/10">
                <p className="mb-4">If you have any questions about these Terms or our services, please contact us:</p>
                <div className="flex items-center text-gaming-primary mb-2">
                  <Mail size={18} className="mr-2" />
                  <a href="mailto:support@freefirecompanion.com" className="hover:underline">support@freefirecompanion.com</a>
                </div>
                <p className="text-sm text-gaming-text/70 mt-4">
                  Thank you for using Freefire Tournaments. We look forward to providing you with exciting tournament experiences!
                </p>
              </div>
            </PolicySection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPolicy; 