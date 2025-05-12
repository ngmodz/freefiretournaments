import React from "react";

interface TableOfContentsProps {
  tocItems: Array<{ id: string; title: string }>;
  activeSection: string;
  scrollToSection: (id: string) => void;
}

const TableOfContents = ({ tocItems, activeSection, scrollToSection }: TableOfContentsProps) => {
  return (
    <div className="hidden lg:block sticky self-start top-24 h-[calc(100vh-6rem)] overflow-y-auto w-64 flex-shrink-0">
      <div className="bg-gaming-card rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-bold text-gaming-primary mb-4">Table of Contents</h3>
        <ul className="space-y-2">
          {tocItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => scrollToSection(item.id)}
                className={`text-left w-full px-3 py-2 rounded transition-all duration-200 hover:bg-gaming-card/80 ${
                  activeSection === item.id 
                    ? "text-gaming-primary font-medium border-l-2 border-gaming-primary pl-2" 
                    : "text-gaming-text/80"
                }`}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TableOfContents; 