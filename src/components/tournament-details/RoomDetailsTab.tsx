import React from "react";
import { Edit3, AlertCircle, Copy, Lock, KeyRound, Hash, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomDetailsProps } from "./types";

const RoomDetailsTab: React.FC<RoomDetailsProps> = ({
  tournament,
  isHost,
  isParticipant,
  onSetRoomDetails,
  onCopy
}) => {
  // If not host or participant, show locked/blurred placeholder
  if (!isHost && !isParticipant) {
    return (
      <div className="bg-gaming-card-deep border border-gaming-border rounded-md p-8 flex flex-col items-center justify-center text-center" style={{ minHeight: 220 }}>
        <Lock size={36} className="text-gaming-muted mb-3" />
        <h3 className="font-semibold text-lg mb-2">Room Details Locked</h3>
        <p className="text-gaming-muted mb-2">Join the tournament to view the Room ID and Password.</p>
        <div className="w-full h-10 bg-gaming-muted/20 rounded mb-2 blur-sm" />
        <div className="w-full h-10 bg-gaming-muted/20 rounded blur-sm" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Custom Room Details</h2>
      </div>
      {(!tournament.room_id && !tournament.room_password) ? (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4 mb-6 text-center">
          <AlertCircle size={24} className="text-yellow-500 mx-auto mb-2" />
          <h3 className="font-semibold text-yellow-400" style={{color: '#A0AEC0'}}>
            {isHost ? "Room details are not set yet. Click 'Set Room Details' to add them." : "Room details are not set yet."}
          </h3>
          {!isHost && <p className="text-sm mt-1" style={{color: '#A0AEC0'}}>They will be available closer to the tournament start time.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-500/10 to-gaming-card-deep border-2 border-orange-400/30 rounded-xl p-5 shadow flex flex-col justify-between relative">
              <div className="flex items-center mb-2">
                <Hash size={20} className="text-orange-400 mr-2" />
                <span className="uppercase tracking-wide text-xs font-semibold text-orange-300">Room ID</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-2xl font-bold text-white tracking-wider">{tournament.room_id || "N/A"}</div>
                <button onClick={() => onCopy(tournament.room_id || "")} className="ml-2 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-white transition-all duration-200 flex items-center text-xs font-medium focus:outline-none shadow-sm hover:shadow-md">
                  <Copy size={14} className="mr-1.5" /> Copy
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-gaming-card-deep border-2 border-purple-400/30 rounded-xl p-5 shadow flex flex-col justify-between relative">
              <div className="flex items-center mb-2">
                <KeyRound size={20} className="text-purple-400 mr-2" />
                <span className="uppercase tracking-wide text-xs font-semibold text-purple-300">Password</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-mono text-2xl font-bold text-white tracking-wider">{tournament.room_password || "N/A"}</div>
                <button onClick={() => onCopy(tournament.room_password || "")} className="ml-2 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-all duration-200 flex items-center text-xs font-medium focus:outline-none shadow-sm hover:shadow-md">
                  <Copy size={14} className="mr-1.5" /> Copy
                </button>
              </div>
            </div>
          </div>
          {isHost && (
            <div className="flex justify-center mt-4">
              <Button 
                onClick={onSetRoomDetails} 
                size="sm" 
                variant="outline"
                className="border-gaming-primary/40 hover:border-gaming-primary text-white hover:bg-gaming-primary/20 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md px-4 py-2"
              >
                <Edit3 size={16} className="mr-1.5 text-gaming-primary" />
                {tournament.room_id ? 'Update' : 'Set'} Room Details
              </Button>
            </div>
          )}
          <div className="flex items-center bg-blue-500/10 border border-blue-400/20 rounded-md p-3 mt-2 text-blue-300 text-sm">
            <Info size={16} className="mr-2 text-blue-400" />
            <span>Share these details only with your team. Do not post them publicly.</span>
          </div>
          <div className="bg-gaming-primary/10 border border-gaming-primary/20 rounded-md p-5 mt-6">
            <h3 className="font-semibold mb-3 flex items-center text-gaming-primary">
              <KeyRound size={18} className="mr-2 text-gaming-primary" /> How to join the custom room
            </h3>
            <ol className="list-decimal list-inside text-gaming-muted space-y-1 pl-2">
              <li className="flex items-center"><span className="w-5 h-5 rounded-full bg-gaming-primary/20 text-gaming-primary flex items-center justify-center mr-2 text-xs font-bold">1</span>Open Free Fire and go to the game lobby</li>
              <li className="flex items-center"><span className="w-5 h-5 rounded-full bg-gaming-primary/20 text-gaming-primary flex items-center justify-center mr-2 text-xs font-bold">2</span>Click on the "Custom Room" button</li>
              <li className="flex items-center"><span className="w-5 h-5 rounded-full bg-gaming-primary/20 text-gaming-primary flex items-center justify-center mr-2 text-xs font-bold">3</span>Select "Enter Room" and input the Room ID</li>
              <li className="flex items-center"><span className="w-5 h-5 rounded-full bg-gaming-primary/20 text-gaming-primary flex items-center justify-center mr-2 text-xs font-bold">4</span>Enter the Password when prompted</li>
              <li className="flex items-center"><span className="w-5 h-5 rounded-full bg-gaming-primary/20 text-gaming-primary flex items-center justify-center mr-2 text-xs font-bold">5</span>Select your character and wait for the match to start</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailsTab; 