import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PolicySectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

const PolicySection = ({ id, title, children }: PolicySectionProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <section id={id} className="bg-gaming-card p-6 rounded-lg shadow-md border border-gaming-border/30 mb-8">
        <h2 className="text-2xl font-bold text-gaming-accent mb-4">{title}</h2>
        <div className="space-y-6">
          {children}
        </div>
      </section>
    </motion.div>
  );
};

export default PolicySection; 