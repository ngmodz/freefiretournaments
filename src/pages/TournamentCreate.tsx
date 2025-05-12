import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  room_type: "Classic" | "Clash Squad";
  custom_settings: {
    auto_aim: boolean;
    fall_damage?: boolean;
    friendly_fire?: boolean;
  };

  // Step 3: Entry & Prizes
  entry_fee: number;
  prize_distribution: {
    [key: string]: number; // e.g., "1st": 70
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
      "1st": 70,
      "2nd": 20,
      "3rd": 10,
    },
    rules: "",
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
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Back button */}
      <Link to="/home" className="inline-flex items-center text-gaming-muted hover:text-gaming-text mb-4">
        <ArrowLeft size={18} className="mr-1" /> Back to tournaments
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Create Tournament</h1>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {["Basic Info", "Game Settings", "Entry & Prizes", "Rules & Media", "Review"].map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1 
                  ${index + 1 === currentStep 
                    ? "bg-gaming-primary text-white" 
                    : index + 1 < currentStep 
                      ? "bg-green-500 text-white" 
                      : "bg-gaming-card text-gaming-muted"
                  }`}
              >
                {index + 1 < currentStep ? "✓" : index + 1}
              </div>
              <span className="text-xs text-gaming-muted hidden md:block">{step}</span>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gaming-card h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gaming-primary rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${(currentStep - 1) * 25}%` }}
          ></div>
        </div>
      </div>

      {/* Current step */}
      <Card className="bg-gaming-card p-6">
        {renderStep()}
      </Card>
    </div>
  );
};

export default TournamentCreate; 