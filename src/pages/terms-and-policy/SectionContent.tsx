import React from "react";

interface Subsection {
  title: string;
  content: React.ReactNode;
}

interface SectionContentProps {
  id: string;
  title: string;
  subsections: Subsection[];
}

const SectionContent = ({ id, title, subsections }: SectionContentProps) => {
  return (
    <section id={id} className="bg-gaming-card p-6 rounded-lg shadow-md border border-gaming-border/30 mb-8">
      <h2 className="text-2xl font-bold text-gaming-accent mb-4">{title}</h2>
      
      <div className="space-y-6">
        {subsections.map((subsection, index) => (
          <div key={index} className="bg-gaming-card/50 p-4 rounded-lg border border-gaming-border/10">
            <h3 className="text-xl font-semibold text-gaming-text mb-3">{subsection.title}</h3>
            {subsection.content}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SectionContent; 