import { Search, Filter, Map, Users } from "lucide-react";
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
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface TournamentFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

// Common search suggestions
const SEARCH_SUGGESTIONS = {
  modes: ["Solo", "Duo", "Squad"],
  maps: ["Bermuda", "Kalahari", "Purgatory", "Alpine"]
};

const TournamentFilters = ({ 
  filter, 
  setFilter, 
  sortBy, 
  setSortBy,
  searchQuery = "",
  setSearchQuery = () => {}
}: TournamentFiltersProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update local state when prop changes, but only if it's different from input value
  // This prevents the input from being reset while typing
  useEffect(() => {
    if (searchQuery !== inputValue && !isFocused) {
      setInputValue(searchQuery);
    }
  }, [searchQuery, isFocused]);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new timer
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(newValue);
    }, 500); // Increased debounce time for better user experience
  };

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          ref={inputRef}
          type="text" 
          placeholder="Search by name, mode (Solo, Duo, Squad) or map..." 
          className="w-full pl-10 pr-4 py-3 bg-transparent relative z-10 rounded-lg text-white placeholder-[#A0A0A0]/70 focus:outline-none transition-all duration-300"
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            // Sync the input value with the search query when blurring
            if (inputValue !== searchQuery) {
              setSearchQuery(inputValue);
            }
            // Don't hide suggestions immediately to allow clicking them
            setTimeout(() => {
              if (!suggestionsRef.current?.contains(document.activeElement)) {
                setShowSuggestions(false);
              }
            }, 200);
          }}
          value={inputValue}
          onChange={handleSearchChange}
        />

        {/* Search suggestions */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#333333] rounded-lg shadow-lg z-20 overflow-hidden"
          >
            {/* Game modes suggestions */}
            <div className="p-2">
              <div className="flex items-center text-xs text-gaming-primary mb-1">
                <Users size={14} className="mr-1" /> Game Modes
              </div>
              <div className="flex flex-wrap gap-1">
                {SEARCH_SUGGESTIONS.modes.map(mode => (
                  <button
                    key={mode}
                    className="px-2 py-1 text-xs bg-[#252525] hover:bg-gaming-primary/20 rounded-md text-white"
                    onClick={() => handleSuggestionClick(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Maps suggestions */}
            <div className="p-2 border-t border-[#333333]">
              <div className="flex items-center text-xs text-gaming-accent mb-1">
                <Map size={14} className="mr-1" /> Maps
              </div>
              <div className="flex flex-wrap gap-1">
                {SEARCH_SUGGESTIONS.maps.map(map => (
                  <button
                    key={map}
                    className="px-2 py-1 text-xs bg-[#252525] hover:bg-gaming-primary/20 rounded-md text-white"
                    onClick={() => handleSuggestionClick(map)}
                  >
                    {map}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
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
                <Trophy size={14} className="mr-2" /> Prize Credits (Low to High)
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prize-desc" className="text-xs focus:bg-gaming-primary/20 focus:text-white">
                <Trophy size={14} className="mr-2" /> Prize Credits (High to Low)
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TournamentFilters; 