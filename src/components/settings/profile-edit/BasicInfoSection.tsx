import React, { useState } from "react";
import { User, BadgeInfo, Mail, Phone, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customInputStyles } from "./utils";
import { FormErrors, ProfileFormData } from "./types";

interface BasicInfoSectionProps {
  formData: ProfileFormData;
  errors: FormErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  errors,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-white">Basic Information</h3>
      
      {/* Required Game Info */}
      <div className="space-y-4">
        <Label 
          htmlFor="ign" 
          className="text-base text-white flex items-center gap-1.5"
        >
          <User size={16} className="text-gaming-primary/70" />
          Free Fire IGN
          <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center">
          <div className="relative flex-1">
            <Input
              id="ign"
              name="ign"
              placeholder="Your In-Game Name"
              value={formData.ign}
              onChange={handleInputChange}
              className={customInputStyles}
              required
            />
            {errors.ign && (
              <div className="text-red-500 text-sm mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{errors.ign}</span>
                </div>
              </div>
            )}
            <div className="text-gray-500 text-sm mt-1">Please ensure this matches your exact In-Game Name as it appears in Free Fire for tournament verification. (Note: IGNs no longer need to be unique)</div>
          </div>
        </div>
      </div>

      {/* UID Field (Editable) */}
      <div className="space-y-4">
        <Label 
          htmlFor="uid" 
          className="text-base text-white flex items-center gap-1.5"
        >
          <BadgeInfo size={16} className="text-gaming-primary/70" />
          UID (Unique ID)
          <span className="text-red-500">*</span>
        </Label>
        <div className="flex items-center">
          <div className="relative flex-1">
            <Input
              id="uid"
              name="uid"
              placeholder="Your Unique ID"
              value={formData.uid}
              onChange={handleInputChange}
              className={customInputStyles}
              required
            />
            {errors.uid && (
              <div className="text-red-500 text-sm mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{errors.uid}</span>
                </div>
              </div>
            )}
            <div className="text-gray-500 text-sm mt-1">This is your unique ID for prize money distribution and in-game identification. (Note: UIDs no longer need to be unique)</div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <Label htmlFor="fullName" className="text-sm text-gaming-muted block mb-1 font-medium">
          Full Name
        </Label>
        <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
          <div className="flex items-center bg-[#1a1a1a] w-full">
            <div className="px-3 py-2">
              <User className="h-5 w-5 text-gaming-primary" />
            </div>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={customInputStyles}
              placeholder="Your full name"
              autoComplete="off"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="email" className="text-sm text-gaming-muted block mb-1 font-medium">
          Email Address
        </Label>
        <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
          <div className="flex items-center bg-[#1a1a1a] w-full">
            <div className="px-3 py-2">
              <Mail className="h-5 w-5 text-gaming-primary" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={customInputStyles}
              placeholder="Your email address"
              autoComplete="off"
            />
          </div>
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>
      
      <div className="space-y-4">
        <Label htmlFor="phone" className="text-sm text-gaming-muted block mb-1 font-medium">
          Phone Number
        </Label>
        <div className="overflow-hidden rounded-md bg-transparent border border-gaming-border shadow-sm">
          <div className="flex items-center bg-[#1a1a1a] w-full">
            <div className="px-3 py-2">
              <Phone className="h-5 w-5 text-gaming-primary" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={customInputStyles}
              placeholder="Your phone number"
              autoComplete="off"
            />
          </div>
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>
    </div>
  );
};

export default BasicInfoSection; 