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
      <h3 className="text-lg font-medium text-white text-center">Basic Information</h3>
      
      {/* Required Game Info */}
      <div className="space-y-5">
        {/* IGN Field */}
        <div className="space-y-2">
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
                className={`${customInputStyles} text-base`}
                required
              />
              {errors.ign && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.ign}</span>
                  </div>
                </div>
              )}
              <div className="text-gray-500 text-xs mt-2 leading-relaxed">
                Please ensure this matches your exact In-Game Name as it appears in Free Fire for tournament verification.
              </div>
            </div>
          </div>
        </div>

        {/* UID Field */}
        <div className="space-y-2">
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
                className={`${customInputStyles} text-base`}
                required
              />
              {errors.uid && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.uid}</span>
                  </div>
                </div>
              )}
              <div className="text-gray-500 text-xs mt-2 leading-relaxed">
                This is your unique ID for prize money distribution and in-game identification.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-5">
        <div className="space-y-2">
          <Label 
            htmlFor="fullName" 
            className="text-base text-white flex items-center gap-1.5"
          >
            <User size={16} className="text-gaming-primary/70" />
            Full Name
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Input
                id="fullName"
                name="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`${customInputStyles} text-base`}
                required
              />
              {errors.fullName && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.fullName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm text-gaming-muted block font-medium">
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
                className={customInputStyles}
                placeholder="Your email address"
                autoComplete="off"
                readOnly // Make email field read-only
              />
            </div>
          </div>
          <div className="text-gray-500 text-xs mt-2 leading-relaxed">
            Your email address cannot be changed from this page. Please contact support if you need to update it.
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        
        <div className="space-y-2">
          <Label 
            htmlFor="phone" 
            className="text-base text-white flex items-center gap-1.5"
          >
            <Phone size={16} className="text-gaming-primary/70" />
            Phone Number
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`${customInputStyles} text-base`}
                placeholder="Your phone number"
                required
              />
              {errors.phone && (
                <div className="text-red-500 text-sm mt-2 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{errors.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection; 