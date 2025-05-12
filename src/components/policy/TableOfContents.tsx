import { ChevronRight } from "lucide-react";

interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TocItem[];
  activeSection: string;
  onSectionClick: (id: string) => void;
  isMobile?: boolean;
}

const TableOfContents = ({ items, activeSection, onSectionClick, isMobile = false }: TableOfContentsProps) => {
  if (isMobile) {
    return (
      <div className="mb-6">
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
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionClick(item.id)}
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
  }

  return (
    <div className="sticky self-start top-24 h-[calc(100vh-6rem)] overflow-y-auto w-64 flex-shrink-0">
      <div className="bg-gaming-card rounded-lg p-4 shadow-md">
        <h3 className="text-lg font-bold text-gaming-primary mb-4">Table of Contents</h3>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionClick(item.id)}
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