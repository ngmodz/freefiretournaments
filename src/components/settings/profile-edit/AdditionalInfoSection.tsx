import React from "react";
import { MapPin, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Additional Information</h3>
      
      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm text-gaming-muted block mb-1 font-medium">
          Location
        </Label>
        <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
          <div className="flex items-center bg-[#1a1a1a] w-full">
            <div className="px-3 py-2">
              <MapPin className="h-5 w-5 text-gaming-primary" />
            </div>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={customInputStyles}
              placeholder="Your location"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="birthdate" className="text-sm text-gaming-muted block mb-1 font-medium">
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
      
      <div className="space-y-2">
        <Label htmlFor="gender" className="text-sm text-gaming-muted block mb-1 font-medium">
          Gender
        </Label>
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
          >
            <option value="" disabled>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoSection; 