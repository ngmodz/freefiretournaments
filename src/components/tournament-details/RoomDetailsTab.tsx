import React from "react";
import { Edit3, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomDetailsProps } from "./types";

const RoomDetailsTab: React.FC<RoomDetailsProps> = ({
  tournament,
  isHost,
  onSetRoomDetails,
  onCopy
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Custom Room Details</h2>
        {isHost && (
          <Button 
            onClick={onSetRoomDetails} 
            size="sm" 
            variant="outline"
            className="border-gaming-accent text-gaming-accent hover:bg-gaming-accent/10"
          >
            <Edit3 size={16} className="mr-1.5" />
            {tournament.room_id ? 'Update' : 'Set'} Room Details
          </Button>
        )}
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
          <div className="bg-gaming-card-deep border border-gaming-border rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gaming-muted">Room ID</div>
              <button onClick={() => onCopy(tournament.room_id || "")} className="text-gaming-primary hover:text-gaming-primary/80 flex items-center text-sm">
                <Copy size={14} className="mr-1" /> Copy
              </button>
            </div>
            <div className="font-mono text-xl font-semibold text-white">{tournament.room_id || "N/A"}</div>
          </div>
          
          <div className="bg-gaming-card-deep border border-gaming-border rounded-md p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gaming-muted">Password</div>
              <button onClick={() => onCopy(tournament.room_password || "")} className="text-gaming-primary hover:text-gaming-primary/80 flex items-center text-sm">
                <Copy size={14} className="mr-1" /> Copy
              </button>
            </div>
            <div className="font-mono text-xl font-semibold text-white">{tournament.room_password || "N/A"}</div>
          </div>
          
          <div className="bg-gaming-primary/10 border border-gaming-primary/20 rounded-md p-4 mt-6">
            <h3 className="font-semibold mb-2">How to join the custom room</h3>
            <ol className="list-decimal list-inside text-gaming-muted space-y-2 pl-2">
              <li>Open Free Fire and go to the game lobby</li>
              <li>Click on the "Custom Room" button</li>
              <li>Select "Enter Room" and input the Room ID</li>
              <li>Enter the Password when prompted</li>
              <li>Select your character and wait for the match to start</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDetailsTab; 