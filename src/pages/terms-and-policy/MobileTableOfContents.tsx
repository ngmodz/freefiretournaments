import React from "react";
import { ChevronRight } from "lucide-react";

interface MobileTableOfContentsProps {
  tocItems: Array<{ id: string; title: string }>;
  activeSection: string;
  scrollToSection: (id: string) => void;
}

const MobileTableOfContents = ({ 
  tocItems, 
  activeSection, 
  scrollToSection 
}: MobileTableOfContentsProps) => {
  return (
    <div className="lg:hidden mb-6">
      <div className="bg-gaming-card rounded-lg p-4 shadow-md">
        <details className="group">
          <summary className="flex justify-between items-center font-medium cursor-pointer list-none">
            <span className="text-gaming-primary font-bold">Table of Contents</span>
            <span className="transition group-open:rotate-180">
              <ChevronRight size={20} />
            </span>
          </summary>
          <div className="mt-3 group-open:animate-fadeIn">
            <ul className="space-y-2 pl-2">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`text-left w-full px-2 py-1 rounded hover:bg-gaming-card/80 transition-colors ${
                      activeSection === item.id ? "text-gaming-primary font-medium" : "text-gaming-text/80"
                    }`}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default MobileTableOfContents; 