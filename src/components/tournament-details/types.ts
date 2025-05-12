import { Tournament } from "@/lib/tournamentService";

export interface TournamentProps {
  id: string;
  tournament: Tournament;
  isHost: boolean;
  loading: boolean;
  currentUser: any; // using any for FirebaseUser type to avoid imports
  onRefresh: () => void;
}

export interface TournamentHeaderProps {
  tournament: Tournament;
  isHost: boolean;
  onSetRoomDetails: () => void;
}

export interface TournamentDetailsSidebarProps {
  tournament: Tournament;
  progressPercentage: number;
  spotsLeft: number;
  onJoin: () => void;
}

export interface RoomDetailsProps {
  tournament: Tournament;
  isHost: boolean;
  onSetRoomDetails: () => void;
  onCopy: (text: string) => void;
}

export interface RoomDetailsDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  roomId: string;
  setRoomId: (roomId: string) => void;
  roomPassword: string;
  setRoomPassword: (password: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export interface TournamentTabsProps {
  tournament: Tournament;
  isHost: boolean;
  onSetRoomDetails: () => void;
  onCopy: (text: string) => void;
} 