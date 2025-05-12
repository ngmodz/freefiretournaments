import { ReactNode } from "react";

interface PolicySubsectionProps {
  title: string;
  children: ReactNode;
}

const PolicySubsection = ({ title, children }: PolicySubsectionProps) => {
  return (
    <div className="bg-gaming-card/50 p-4 rounded-lg border border-gaming-border/10">
      <h3 className="text-xl font-semibold text-gaming-text mb-3">{title}</h3>
      {children}
    </div>
  );
};

export default PolicySubsection; 