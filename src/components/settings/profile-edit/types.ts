import { ProfileUpdate } from "@/lib/types";

export interface ProfileEditFormProps {
  onClose: () => void;
}

export interface FormErrors {
  [key: string]: string;
}

export type ProfileFormData = ProfileUpdate; 