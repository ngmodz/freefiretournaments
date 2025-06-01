import { Search, Filter } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem 
} from "@/components/ui/dropdown-menu";
import { Calendar, Trophy } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

interface TournamentFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
}

const TournamentFilters = ({ filter, setFilter, sortBy, setSortBy }: TournamentFiltersProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="mb-4">
      <motion.div 
        className={`relative mb-3 ${isFocused ? 'shadow-glow' : ''}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated gradient border */}
        <div className={`absolute inset-0 rounded-lg ${isFocused ? 'bg-gradient-to-r from-gaming-primary via-gaming-accent to-gaming-primary p-[1.5px]' : 'bg-[#333333] p-[1px]'}`}>
          <div className="absolute inset-0 bg-[#151926] rounded-lg"></div>
        </div>
        
        {/* Search icon with animation - fixed vertical alignment */}
        <motion.div
          animate={{ scale: isFocused ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className="absolute left-3 top-0 h-full flex items-center justify-center z-10"
        >
          <Search className={`${isFocused ? 'text-gaming-primary' : 'text-[#A0A0A0]'}`} size={18} />
        </motion.div>
        
        {/* Input field */}
        <input 
          type="text" 
          placeholder="Search tournaments..." 
          className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 rounded-lg text-white placeholder-[#A0A0A0]/70 focus:outline-none transition-all duration-300"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </motion.div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-300 ${filter === "all" ? "bg-gaming-primary text-white shadow-glow" : "bg-[#1A1A1A] text-[#A0A0A0] hover:bg-gaming-primary/20"}`}>
          All Tournaments
        </button>
        <button onClick={() => setFilter("active")} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-300 ${filter === "active" ? "bg-gaming-primary text-white shadow-glow" : "bg-[#1A1A1A] text-[#A0A0A0] hover:bg-gaming-primary/20"}`}>
          Upcoming
        </button>
        
        {/* Sort & Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 bg-[#1A1A1A] text-[#A0A0A0] hover:bg-gaming-primary/20 flex items-center transition-all duration-300">
            <Filter size={14} className="mr-1" /> Sort & Filter
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1A1A1A] border-[#333333] text-white">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#333333]" />
            <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
              <DropdownMenuRadioItem value="none" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                Default
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-asc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <Calendar size={14} className="mr-2" /> Date (Earliest first)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-desc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <Calendar size={14} className="mr-2" /> Date (Latest first)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-asc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <span className="mr-2 font-bold text-sm">₹</span> Entry Fee (Low to High)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="price-desc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <span className="mr-2 font-bold text-sm">₹</span> Entry Fee (High to Low)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prize-asc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <Trophy size={14} className="mr-2" /> Prize Money (Low to High)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prize-desc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <Trophy size={14} className="mr-2" /> Prize Money (High to Low)
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TournamentFilters; 