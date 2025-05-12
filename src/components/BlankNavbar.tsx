import { motion } from "framer-motion";

interface BlankNavbarProps {
  // No props needed for the blank navbar
}

const BlankNavbar = () => {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gaming-bg/90 border-t border-gaming-border backdrop-blur-lg py-0.5 pb-safe"
    >
      <nav className="grid grid-cols-1 max-w-md mx-auto">
        {/* Empty navigation bar */}
        <div className="h-10"></div>
      </nav>
    </motion.div>
  );
};

export default BlankNavbar; 