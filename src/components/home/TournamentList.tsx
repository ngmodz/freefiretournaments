import { Link } from "react-router-dom";
import TournamentCard from "@/components/TournamentCard";
import { TournamentType } from "@/components/home/types";
import { motion, useScroll, useTransform } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface TournamentCardWrapperProps {
  tournament: TournamentType;
  index: number;
}

const TournamentCardWrapper = ({ tournament, index }: TournamentCardWrapperProps) => {
  const ref = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isInView = useInView(ref, {
    once: false,
    margin: "0px 0px -5% 0px",
    amount: 0.2,
  });

  // Center detection for mobile
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 0.35, 0.5, 0.65, 1],
    [1, 1, isMobile ? 1.05 : 1, 1, 1]
  );

  const yOffset = useTransform(
    scrollYProgress,
    [0, 0.35, 0.5, 0.65, 1],
    [0, 0, isMobile ? -15 : 0, 0, 0] // This is the scroll-based y offset
  );

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      style={{
        scale,
        y: yOffset, // Apply the scroll-based y-offset here
        backfaceVisibility: "hidden",
        WebkitFontSmoothing: "antialiased",
        perspective: 1000,
        transformStyle: "preserve-3d", // Added for layer promotion
        translateZ: 0, // Added for layer promotion
      }}
      variants={{
        hidden: { 
          opacity: 0, 
          translateY: 10, // Use translateY for variant-based animation
          transition: {
            duration: 0.15,
            ease: "easeIn"
          }
        },
        visible: { 
          opacity: 1, 
          translateY: 0, // Use translateY for variant-based animation
          transition: {
            duration: 0.2,
            delay: Math.min(index * 0.05, 0.1),
            ease: [0.2, 0.0, 0.0, 1.0],
          }
        }
      }}
      className="will-change-transform will-change-opacity"
    >
      <motion.div
        style={{
          boxShadow: useTransform(
            scrollYProgress,
            [0, 0.35, 0.5, 0.65, 1],
            ["0px 0px 0px rgba(147, 51, 234, 0)", 
             "0px 0px 0px rgba(147, 51, 234, 0)", 
             isMobile ? "0px 15px 30px rgba(147, 51, 234, 0.3)" : "0px 0px 0px rgba(147, 51, 234, 0)", 
             "0px 0px 0px rgba(147, 51, 234, 0)", 
             "0px 0px 0px rgba(147, 51, 234, 0)"]
          ),
          transform: "translateZ(0)", // Promote inner div to its own layer too
        }}
      >
        <TournamentCard tournament={tournament} />
      </motion.div>
    </motion.div>
  );
};

interface TournamentListProps {
  tournaments: TournamentType[];
}

const TournamentList = ({ tournaments }: TournamentListProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 transform-gpu">
      {tournaments.length > 0 ? (
        tournaments.map((tournament, index) => (
          <TournamentCardWrapper 
            key={tournament.id} 
            tournament={tournament}
            index={index}
          />
        ))
      ) : (
        <motion.div 
          className="col-span-full text-center py-10"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.2,
            ease: "easeOut",
          }}
        >
          <p className="text-[#A0A0A0] mb-2">No tournaments match your filter criteria</p>
          <Link to="/tournament/create" className="text-gaming-primary hover:underline">
            Create a tournament?
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default TournamentList;
