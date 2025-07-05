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
                <p className="text-sm text-gaming-text/70 mb-6">Last Updated: July 6, 2025</p>
                
                <div className="p-4 bg-gaming-card/50 border border-gaming-border/10 rounded-md mb-6">
                  <p className="text-gaming-text/90">
                    Welcome to <strong className="text-gaming-primary">Freefire Tournaments</strong>, a Progressive Web App (PWA) designed to host and manage Free Fire tournaments. By accessing or using our platform, you agree to be bound by these Terms and Policy ("Terms"). If you do not agree, please do not use the app. These Terms govern your use of the app, including features such as tournament creation, participation, payments, and user interactions.
                  </p>
                </div>

                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md mb-6">
                  <p className="font-semibold text-red-400 mb-2">⚠️ IMPORTANT LEGAL NOTICE:</p>
                  <p className="text-gaming-text/90 text-sm leading-relaxed">
                    <strong>BY USING THIS PLATFORM, YOU ACKNOWLEDGE THAT:</strong><br/>
                    • Tournament cancellations, technical issues, or service interruptions are NOT our fault<br/>
                    • You use this service entirely at your own risk<br/>
                    • We are not liable for any losses, damages, or issues arising from platform use<br/>
                    • You have read, understood, and agreed to all terms and conditions<br/>
                    • Disputes must be resolved through arbitration, not courts<br/>
                    • These terms protect the platform operators from legal liability
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

              <PolicySubsection title="2.4 Tournament Cancellations and Modifications">
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg mb-4">
                  <p className="font-semibold text-red-400 mb-2">IMPORTANT DISCLAIMER:</p>
                  <p className="text-gaming-text/90">
                    <strong>Freefire Tournaments and its operators are NOT responsible for any tournament cancellations, 
                    modifications, or failures due to technical issues, server problems, third-party game issues, 
                    host availability, or any other circumstances beyond our direct control.</strong>
                  </p>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tournaments may be cancelled or modified at any time due to technical issues, insufficient participants, or host discretion.</li>
                  <li>In case of cancellation, entry fees will be refunded to participants' wallets within 48 hours.</li>
                  <li>We are not liable for any losses, damages, or inconvenience caused by tournament cancellations.</li>
                  <li>Participants acknowledge that tournaments depend on third-party services (Free Fire servers, internet connectivity) which are beyond our control.</li>
                  <li>No compensation will be provided for time spent preparing for cancelled tournaments.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 3: Payment and Wallet */}
            <PolicySection id="section-3" title="3. Payment and Wallet">
              <PolicySubsection title="3.1 Wallet System">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Our platform uses a digital wallet system for tournament entry fees and prize distributions.</li>
                  <li>All transactions are processed through secure third-party payment gateways.</li>
                  <li>Wallet balances are stored securely and can be withdrawn according to our withdrawal policies.</li>
                  <li>Minimum withdrawal amounts and processing fees may apply.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="3.2 Payment Processing">
                <ul className="list-disc pl-6 space-y-2">
                  <li>We use certified payment processors for all financial transactions.</li>
                  <li>All payment information is encrypted and handled according to industry standards.</li>
                  <li>We do not store sensitive payment information on our servers.</li>
                  <li>Payment disputes should be reported within 7 days of the transaction.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="3.3 Refund Policy">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Entry fees are generally non-refundable once a tournament begins.</li>
                  <li>Refunds may be issued for cancelled tournaments or technical errors on our part.</li>
                  <li>Refund processing may take 3-7 business days depending on the payment method.</li>
                  <li>Withdrawal fees are non-refundable.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 4: Privacy Policy */}
            <PolicySection id="section-4" title="4. Privacy Policy">
              <PolicySubsection title="4.1 Data Collection">
                <ul className="list-disc pl-6 space-y-2">
                  <li>We collect information necessary to provide our services, including email, username, and game statistics.</li>
                  <li>Payment information is handled by third-party processors and not stored on our servers.</li>
                  <li>We may collect device information and usage analytics to improve our services.</li>
                  <li>Location data may be collected for fraud prevention and regional compliance.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="4.2 Data Usage">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your data is used to provide tournament services, process payments, and communicate with you.</li>
                  <li>We may use aggregated, anonymized data for analytics and service improvement.</li>
                  <li>We do not sell personal information to third parties.</li>
                  <li>Marketing communications can be opted out of at any time.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="4.3 Data Protection">
                <ul className="list-disc pl-6 space-y-2">
                  <li>We implement industry-standard security measures to protect your data.</li>
                  <li>Access to personal data is restricted to authorized personnel only.</li>
                  <li>Data breaches will be reported according to applicable laws and regulations.</li>
                  <li>You have the right to request access, correction, or deletion of your personal data.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 5: Intellectual Property */}
            <PolicySection id="section-5" title="5. Intellectual Property">
              <PolicySubsection title="5.1 Platform Content">
                <ul className="list-disc pl-6 space-y-2">
                  <li>All platform content, including design, code, and functionality, is owned by Freefire Tournaments.</li>
                  <li>Users are granted a limited license to use the platform for its intended purpose.</li>
                  <li>Reproduction, distribution, or modification of platform content is prohibited without permission.</li>
                  <li>Free Fire is a trademark of Garena International I Private Limited. We are not affiliated with Garena.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="5.2 User Content">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users retain ownership of content they create (usernames, tournament descriptions, etc.).</li>
                  <li>By using our platform, you grant us a license to use your content for service provision.</li>
                  <li>Users are responsible for ensuring their content doesn't infringe on third-party rights.</li>
                  <li>We may remove content that violates our terms or applicable laws.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 6: Limitation of Liability */}
            <PolicySection id="section-6" title="6. Limitation of Liability">
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg mb-4">
                <p className="font-semibold text-red-400 mb-2">CRITICAL LEGAL DISCLAIMER:</p>
                <p className="text-gaming-text/90">
                  <strong>BY USING THIS PLATFORM, YOU ACKNOWLEDGE AND AGREE THAT YOU USE OUR SERVICES AT YOUR OWN RISK. 
                  FREEFIRE TOURNAMENTS AND ITS OPERATORS ARE NOT LIABLE FOR ANY DAMAGES, LOSSES, OR ISSUES THAT MAY ARISE.</strong>
                </p>
              </div>
              
              <PolicySubsection title="6.1 Service Availability">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>We provide our services "AS IS" without warranties of any kind.</strong></li>
                  <li>We do not guarantee uninterrupted or error-free service availability.</li>
                  <li>Server downtime, maintenance, or technical issues may occur without notice.</li>
                  <li>We are not responsible for losses due to service unavailability during tournaments.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="6.2 Third-Party Dependencies">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Our platform depends on third-party services (Free Fire servers, payment processors, internet providers) which are beyond our control.</strong></li>
                  <li>We are not liable for issues caused by Free Fire game servers, updates, or policy changes.</li>
                  <li>Payment processor downtime or errors are not our responsibility.</li>
                  <li>Internet connectivity issues affecting tournament participation are not our fault.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="6.3 User Disputes and Conduct">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>We are not responsible for disputes between users, including but not limited to tournament hosts and participants.</strong></li>
                  <li>Users must resolve conflicts independently or through appropriate legal channels.</li>
                  <li>We do not mediate disputes over tournament results, prize distributions, or rule interpretations.</li>
                  <li>Fraudulent activity by users is their sole responsibility, not ours.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="6.4 Maximum Liability">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Our total liability for any claim shall not exceed the amount you paid to us in the 30 days prior to the claim.</strong></li>
                  <li>We are not liable for indirect, incidental, special, or consequential damages.</li>
                  <li>This includes lost profits, data loss, or business interruption.</li>
                  <li>Some jurisdictions may not allow these limitations, in which case they apply to the maximum extent permitted by law.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 7: Termination */}
            <PolicySection id="section-7" title="7. Termination">
              <PolicySubsection title="7.1 Account Termination">
                <ul className="list-disc pl-6 space-y-2">
                  <li>We may terminate or suspend accounts for violation of these terms.</li>
                  <li>Users may delete their accounts at any time through the app settings.</li>
                  <li>Upon termination, access to the platform will be immediately revoked.</li>
                  <li>Wallet balances will be available for withdrawal for 90 days after termination.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="7.2 Effect of Termination">
                <ul className="list-disc pl-6 space-y-2">
                  <li>All user data may be deleted after account termination.</li>
                  <li>Ongoing tournaments may be affected by account termination.</li>
                  <li>Terminated users forfeit any pending tournament entries or prizes.</li>
                  <li>These terms continue to apply after termination for legal purposes.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 8: Modifications to Terms */}
            <PolicySection id="section-8" title="8. Modifications to Terms">
              <PolicySubsection title="8.1 Updates and Changes">
                <ul className="list-disc pl-6 space-y-2">
                  <li>We reserve the right to modify these terms at any time.</li>
                  <li>Users will be notified of significant changes via email or in-app notifications.</li>
                  <li>Continued use of the platform after changes constitutes acceptance of new terms.</li>
                  <li>If you disagree with changes, you must stop using the platform.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="8.2 Version Control">
                <ul className="list-disc pl-6 space-y-2">
                  <li>The current version of terms is always available in the app.</li>
                  <li>Previous versions may be archived for reference.</li>
                  <li>The "Last Updated" date indicates when terms were last modified.</li>
                  <li>Major changes will be highlighted in update notifications.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 9: Governing Law */}
            <PolicySection id="section-9" title="9. Governing Law">
              <PolicySubsection title="9.1 Jurisdiction">
                <ul className="list-disc pl-6 space-y-2">
                  <li>These terms are governed by the laws of [Your Jurisdiction].</li>
                  <li>Any disputes will be resolved in the courts of [Your Jurisdiction].</li>
                  <li>Users consent to the personal jurisdiction of these courts.</li>
                  <li>If any provision is found invalid, the remaining terms continue to apply.</li>
                </ul>
              </PolicySubsection>
              
              <PolicySubsection title="9.2 International Users">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Users from other jurisdictions use the platform at their own risk.</li>
                  <li>Local laws and regulations must be followed by users.</li>
                  <li>We do not guarantee compliance with all international laws.</li>
                  <li>Users are responsible for understanding their local legal requirements.</li>
                </ul>
              </PolicySubsection>

              <PolicySubsection title="9.3 Dispute Resolution">
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg mb-4">
                  <p className="font-semibold text-yellow-400 mb-2">MANDATORY ARBITRATION:</p>
                  <p className="text-gaming-text/90">
                    <strong>Any disputes arising from use of this platform must be resolved through binding arbitration, 
                    not through courts. Class action lawsuits are waived by using this service.</strong>
                  </p>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Disputes will be resolved through individual arbitration proceedings.</li>
                  <li>Arbitration will be conducted according to established arbitration rules.</li>
                  <li>The arbitrator's decision will be final and binding.</li>
                  <li>Users waive the right to participate in class action lawsuits.</li>
                </ul>
              </PolicySubsection>
            </PolicySection>

            {/* Section 10: Contact Us */}
            <PolicySection id="section-10" title="10. Contact Us">
              <div className="p-6 bg-gaming-card/50 rounded-lg border border-gaming-border/10">
                <p className="mb-4">If you have any questions about these Terms or our services, please contact us:</p>
                <div className="flex items-center text-gaming-primary mb-2">
                  <Mail size={18} className="mr-2" />
                  <a href="mailto:ngmodz05@gmail.com" className="hover:underline">ngmodz05@gmail.com</a>
                </div>
                
                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <p className="font-semibold text-yellow-400 mb-2">Legal Contact Notice:</p>
                  <p className="text-sm text-gaming-text/80">
                    Contact does not waive any terms, disclaimers, or liability limitations stated above. 
                    By contacting us, you acknowledge that you have accepted all terms and conditions. 
                    Responses to inquiries do not constitute legal advice or guarantee of service.
                  </p>
                </div>

                <p className="text-sm text-gaming-text/70 mt-4">
                  Thank you for using Freefire Tournaments. We look forward to providing you with exciting tournament experiences!
                  <br/><br/>
                  <strong>Remember:</strong> By using our platform, you have accepted full responsibility for your participation 
                  and waived claims against the platform operators for any issues that may arise.
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