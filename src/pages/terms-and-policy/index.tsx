import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import TableOfContents from "./TableOfContents";
import MobileTableOfContents from "./MobileTableOfContents";
import IntroSection from "./IntroSection";
import SectionContent from "./SectionContent";
import { tocItems, sections } from "./content";

const TermsAndPolicy = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState("section-1");
  
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
      <Header navigate={navigate} />
      
      <div className="container mx-auto py-6 px-4 lg:px-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* Mobile TOC Dropdown */}
          <MobileTableOfContents 
            tocItems={tocItems} 
            activeSection={activeSection} 
            scrollToSection={scrollToSection} 
          />
          
          {/* Desktop TOC Sidebar */}
          <TableOfContents 
            tocItems={tocItems} 
            activeSection={activeSection} 
            scrollToSection={scrollToSection} 
          />

          {/* Main content */}
          <div 
            ref={contentRef}
            className="flex-1 prose prose-invert prose-gaming max-w-none lg:max-w-4xl"
          >
            <IntroSection />
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {sections.map((section) => (
                <SectionContent 
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  subsections={section.subsections}
                />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndPolicy; 