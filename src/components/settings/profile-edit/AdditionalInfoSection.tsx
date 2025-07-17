import React from "react";
import { MapPin, Calendar, FileText, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { customInputStyles } from "./utils";
import { FormErrors, ProfileFormData } from "./types";

interface AdditionalInfoSectionProps {
  formData: ProfileFormData;
  errors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (value: string, name: string) => void;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({
  formData,
  errors,
  handleInputChange,
  handleSelectChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Additional Information</h3>
      
      <div className="space-y-5">
        {/* Gender Field - Important for avatar */}
        <div className="space-y-2">
          <Label 
            htmlFor="gender" 
            className="text-base text-white flex items-center gap-1.5"
          >
            Gender
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => handleSelectChange(e.target.value, "gender")}
                  className="w-full bg-[#1a1a1a] border-0 py-3 px-3 text-white focus:outline-none focus:ring-0 appearance-none rounded-md pr-10 text-base"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.25rem 1.25rem',
                    colorScheme: 'dark'
                  }}
                  required
                >
                  <option value="" disabled>Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
              {errors.gender && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.gender}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Location Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="location" 
            className="text-base text-white flex items-center gap-1.5"
          >
            <MapPin size={16} className="text-gaming-primary/70" />
            Location
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`${customInputStyles} text-base`}
                placeholder="Your location"
                required
              />
              {errors.location && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.location}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Date of Birth Field */}
        <div className="space-y-2">
          <Label htmlFor="birthdate" className="text-sm text-gaming-muted block font-medium">
            Date of Birth
          </Label>
          <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
            <div className="flex items-center bg-[#1a1a1a] w-full">
              <div className="px-3 py-2">
                <Calendar className="h-5 w-5 text-gaming-primary" />
              </div>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                className={customInputStyles}
                style={{ 
                  colorScheme: 'dark',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none'
                }}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoSection; 