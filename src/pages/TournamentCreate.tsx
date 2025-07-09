import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthCheck } from "@/hooks/useAuthCheck";

// Step components will be imported here
import BasicInfoForm from "@/components/tournament/BasicInfoForm";
import GameSettingsForm from "@/components/tournament/GameSettingsForm";
import EntryAndPrizesForm from "@/components/tournament/EntryAndPrizesForm";
import RulesAndMediaForm from "@/components/tournament/RulesAndMediaForm";
import ReviewAndPublish from "@/components/tournament/ReviewAndPublish";

// Define the Tournament type
export type TournamentFormData = {
  // Step 1: Basic Information
  name: string;
  description: string;
  mode: "Solo" | "Duo" | "Squad";
  max_players: number;
  start_date: string; // ISO string

  // Step 2: Game Settings
  map: string;
  room_type: "Classic" | "Clash Squad" | "Lone Wolf";
  custom_settings: {
    auto_aim: boolean;
    fall_damage?: boolean;
    friendly_fire?: boolean;
  };

  // Step 3: Entry & Prizes
  entry_fee: number;
  prize_distribution: {
    [key: string]: number;
  };

  // Step 4: Rules & Media
  rules: string;
};

const TournamentCreate = () => {
  const { isLoading } = useAuthCheck({ requireAuth: true });
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TournamentFormData>({
    name: "",
    description: "",
    mode: "Solo",
    max_players: 12,
    start_date: "",
    map: "Bermuda",
    room_type: "Classic",
    custom_settings: {
      auto_aim: false,
    },
    entry_fee: 50,
    prize_distribution: {
      "1st": 250,
      "2nd": 150,
      "3rd": 100,
      "4th": 50
    },
    rules: `Don't change your slot in the custom room as it will make it difficult for the host to verify participants.\nNo use of unauthorized third-party apps or mods.\nNo teaming with other squads during matches.\nIntentionally disconnecting to avoid elimination is prohibited.\nAny form of harassment or toxic behavior will not be tolerated.`,
  });

  // Handle form data updates
  const updateFormData = (stepData: Partial<TournamentFormData>) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  // Handle next step
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step labels
  const steps = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Game Settings" },
    { number: 3, label: "Entry & Prizes" },
    { number: 4, label: "Rules & Media" },
    { number: 5, label: "Review" }
  ];

  // Render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoForm formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
      case 2:
        return <GameSettingsForm formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <EntryAndPrizesForm formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <RulesAndMediaForm formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <ReviewAndPublish formData={formData} prevStep={prevStep} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-bg text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Create Tournament</h1>
        
        {/* Enhanced Stepper */}
        <div className="relative mb-12">
          {/* Progress Line */}
          <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-700 hidden md:block">
            <div 
              className="h-full bg-gradient-to-r from-gaming-primary to-gaming-secondary transition-all duration-500 ease-out progress-line"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          {/* Steps */}
          <div className="flex justify-between items-center relative z-10">
            {steps.map((step, index) => {
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              const isUpcoming = currentStep < step.number;
              
              return (
                <div key={step.number} className="flex flex-col items-center group stepper-step">
                  {/* Step Circle */}
                  <div className="relative">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-3 transition-all duration-300 transform
                        ${isActive 
                          ? "bg-gradient-to-r from-gaming-primary to-gaming-secondary text-white shadow-lg shadow-gaming-primary/50 scale-110 stepper-active" 
                          : isCompleted
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 stepper-completed"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                        }
                        ${isActive ? "ring-4 ring-gaming-primary/30" : ""}
                        group-hover:scale-105`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    
                    {/* Glow effect for active step */}
                    {isActive && (
                      <div className="absolute inset-0 w-12 h-12 rounded-full bg-gaming-primary/20 animate-ping" />
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <div className="text-center">
                    <span 
                      className={`text-xs font-medium transition-colors duration-300
                        ${isActive 
                          ? "text-gaming-primary" 
                          : isCompleted 
                          ? "text-green-400" 
                          : "text-gray-400"
                        }`}
                    >
                      {step.label}
                    </span>
                    
                    {/* Step Status */}
                    <div className="mt-1">
                      {isActive && (
                        <div className="text-xs text-gaming-primary font-semibold">Current</div>
                      )}
                      {isCompleted && (
                        <div className="text-xs text-green-400 font-semibold">Completed</div>
                      )}
                      {isUpcoming && (
                        <div className="text-xs text-gray-500">Pending</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Progress Bar */}
          <div className="mt-6 md:hidden">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Step {currentStep} of {steps.length}</span>
              <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-gaming-primary to-gaming-secondary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Current step content */}
        <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-8 relative transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10">
            {renderStep()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TournamentCreate; 