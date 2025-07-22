import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TournamentFormData } from "@/pages/TournamentCreate";
import React, { useRef } from "react";
import { Calendar, Users, User, UserCheck } from "lucide-react";
import { getTeamSizeForMode } from "@/lib/teamService";

interface BasicInfoFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
}

// Define the valid game modes as a type
type GameMode = "Solo" | "Duo" | "Squad";

const BasicInfoForm = ({ formData, updateFormData, nextStep }: BasicInfoFormProps) => {
  const [name, setName] = useState(formData.name);
  const [description, setDescription] = useState(formData.description);
  const [mode, setMode] = useState<GameMode>(formData.mode as GameMode);
  const [maxPlayers, setMaxPlayers] = useState(formData.max_players);
  const [minParticipants, setMinParticipants] = useState(formData.min_participants);
  const [startDate, setStartDate] = useState(formData.start_date);
  
  // Error states
  const [errors, setErrors] = useState({
    name: "",
    maxPlayers: "",
    minParticipants: "",
    startDate: ""
  });

  const startDateInputRef = useRef<HTMLInputElement>(null);

  // Handle mode change with proper typing and adjust max players
  const handleModeChange = (value: string) => {
    const newMode = value as GameMode;
    setMode(newMode);
    
    // Auto-adjust max players based on mode for better UX
    if (newMode === "Solo") {
      // For solo, max players is just the number of individual players
      if (maxPlayers < 2) setMaxPlayers(12); // Default solo tournament size
    } else if (newMode === "Duo") {
      // For duo, max players should be even (teams of 2)
      const currentTeams = Math.floor(maxPlayers / 2);
      setMaxPlayers(currentTeams * 2);
      if (maxPlayers < 4) setMaxPlayers(12); // At least 6 teams (12 players)
    } else if (newMode === "Squad") {
      // For squad, max players should be divisible by team size
      const currentTeams = Math.floor(maxPlayers / 4);
      setMaxPlayers(currentTeams * 4);
      if (maxPlayers < 8) setMaxPlayers(16); // At least 4 teams (16 players)
    }
  };

  // Calculate team-related info for display
  const getTeamInfo = () => {
    if (mode === "Solo") {
      return {
        teamsCount: maxPlayers,
        playersPerTeam: 1,
        icon: User,
        description: "Individual players"
      };
    } else if (mode === "Duo") {
      return {
        teamsCount: Math.floor(maxPlayers / 2),
        playersPerTeam: 2,
        icon: UserCheck,
        description: "Teams of 2 players"
      };
    } else {
      return {
        teamsCount: Math.floor(maxPlayers / 4),
        playersPerTeam: 4,
        icon: Users,
        description: "Teams of up to 4 players"
      };
    }
  };

  const teamInfo = getTeamInfo();

  const validateForm = () => {
    const newErrors = {
      name: "",
      maxPlayers: "",
      minParticipants: "",
      startDate: ""
    };

    // Validate tournament name
    if (!name.trim()) {
      newErrors.name = "Tournament name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Tournament name must be at least 3 characters";
    }

    // Validate max players
    if (!maxPlayers || maxPlayers <= 0) {
      newErrors.maxPlayers = "Max players is required and must be greater than 0";
    } else if (maxPlayers > 100) {
      newErrors.maxPlayers = "Max players cannot exceed 100";
    }

    // Validate minimum participants
    if (!minParticipants || minParticipants <= 0) {
      newErrors.minParticipants = "Minimum participants is required and must be greater than 0";
    } else if (minParticipants > maxPlayers) {
      newErrors.minParticipants = "Minimum participants cannot exceed max players";
    }

    // Validate start date
    if (!startDate) {
      newErrors.startDate = "Start date and time is required";
    } else {
      const selectedDate = new Date(startDate);
      const now = new Date();
      if (selectedDate <= now) {
        newErrors.startDate = "Start date must be in the future";
      }
    }

    setErrors(newErrors);
    return !newErrors.name && !newErrors.maxPlayers && !newErrors.minParticipants && !newErrors.startDate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateFormData({
        name,
        description,
        mode,
        max_players: maxPlayers,
        min_participants: minParticipants,
        start_date: startDate,
      });
      nextStep();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Basic Tournament Information</h2>
      <p className="text-gray-400 mb-6">Enter the essential details of your tournament</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Tournament Name <span className="text-red-500">*</span>
          </label>
          <Input 
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: "" }));
              }
            }}
            placeholder="Enter a catchy tournament name"
            className={`bg-gaming-card border-2 text-white ${
              errors.name ? "border-red-500" : "border-gray-600"
            }`}
            required
          />
          {errors.name ? (
            <p className="text-xs text-red-500">{errors.name}</p>
          ) : (
            <p className="text-xs text-gray-400">Choose a memorable name for your tournament</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Description</label>
          <Textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tournament, rules, and expectations"
            className="bg-gaming-card border-2 border-gray-600 text-white min-h-[100px]"
          />
          <p className="text-xs text-gray-400">Give players a compelling reason to join your tournament</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Game Mode</label>
            <Select 
              value={mode}
              onValueChange={handleModeChange}
            >
              <SelectTrigger className="bg-gaming-card border-2 border-gray-600 text-white">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent className="bg-gaming-card border-2 border-gray-600 text-white">
                <SelectItem value="Solo">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Solo
                  </div>
                </SelectItem>
                <SelectItem value="Duo">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Duo
                  </div>
                </SelectItem>
                <SelectItem value="Squad">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Squad
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Team Info Display */}
            <div className="mt-2 p-2 bg-gaming-bg/30 rounded-md border border-gaming-border/30">
              <div className="flex items-center gap-2 text-sm text-gaming-muted">
                <teamInfo.icon className="h-4 w-4 text-gaming-primary" />
                <span>{teamInfo.description}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Max Players <span className="text-red-500">*</span>
            </label>
            <Input 
              type="number" 
              value={maxPlayers}
              onChange={(e) => {
                setMaxPlayers(Number(e.target.value));
                if (errors.maxPlayers) {
                  setErrors(prev => ({ ...prev, maxPlayers: "" }));
                }
              }}
              className={`bg-gaming-card border-2 text-white ${
                errors.maxPlayers ? "border-red-500" : "border-gray-600"
              }`}
              min="1"
              max="100"
              required
            />
            {errors.maxPlayers ? (
              <p className="text-xs text-red-500">{errors.maxPlayers}</p>
            ) : (
              <div className="text-xs text-gaming-muted">
                {mode === "Solo" ? (
                  `${maxPlayers} individual players`
                ) : (
                  `${teamInfo.teamsCount} teams (${maxPlayers} total players)`
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Min Participants <span className="text-red-500">*</span>
            </label>
            <Input 
              type="number" 
              value={minParticipants}
              onChange={(e) => {
                setMinParticipants(Number(e.target.value));
                if (errors.minParticipants) {
                  setErrors(prev => ({ ...prev, minParticipants: "" }));
                }
              }}
              className={`bg-gaming-card border-2 text-white ${
                errors.minParticipants ? "border-red-500" : "border-gray-600"
              }`}
              min="1"
              max={maxPlayers}
              required
            />
            {errors.minParticipants ? (
              <p className="text-xs text-red-500">{errors.minParticipants}</p>
            ) : (
              <p className="text-xs text-gray-400">Minimum players needed to start</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Start Date & Time <span className="text-red-500">*</span>
            </label>
            <div className="relative group" style={{ width: '100%' }}>
              <Input
                ref={startDateInputRef}
                type="datetime-local"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate) {
                    setErrors(prev => ({ ...prev, startDate: "" }));
                  }
                }}
                className={`bg-gaming-card border-2 text-white datetime-input ${
                  errors.startDate ? "border-red-500" : "border-gray-600"
                } group-hover:border-gaming-primary focus:border-gaming-primary cursor-pointer pr-12 sm:pr-10`}
                required
              />
              {/* White calendar icon overlay, always inside the input on all screens */}
              <Calendar size={20} color="#fff" className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none z-20" />
              {/* Overlay to make the whole field clickable */}
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => {
                  startDateInputRef.current?.focus();
                  if (startDateInputRef.current?.showPicker) {
                    startDateInputRef.current.showPicker();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Open date and time picker"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    startDateInputRef.current?.focus();
                    if (startDateInputRef.current?.showPicker) {
                      startDateInputRef.current.showPicker();
                    }
                  }
                }}
                style={{ background: 'transparent' }}
              />
            </div>
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <Button 
            type="submit" 
            className="bg-gaming-primary hover:bg-gaming-secondary text-white px-8"
          >
            Next
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BasicInfoForm;