import React from "react";
import { Info } from "lucide-react";
import { Tournament } from "@/lib/tournamentService";

interface InfoTabProps {
  tournament: Tournament;
}

const InfoTab: React.FC<InfoTabProps> = ({ tournament }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Tournament Details</h2>
      <p className="text-gaming-muted mb-6">{tournament.description}</p>
      
      <h3 className="font-semibold mb-2">Tournament Format</h3>
      <ul className="list-disc list-inside text-gaming-muted space-y-1 pl-2 mb-6">
        <li>Mode: {tournament.mode}</li>
        <li>Map: {tournament.map}</li>
        <li>Room Type: {tournament.room_type}</li>
        <li>Max Players: {tournament.max_players}</li>
        <li>Auto Aim: {tournament.custom_settings?.auto_aim ? "On" : "Off"}</li>
      </ul>
      
      <h3 className="font-semibold mb-2">Schedule</h3>
      <div className="space-y-2 text-gaming-muted mb-6">
        <div className="flex justify-between">
          <span>Registration closes:</span>
          <span>{new Date(new Date(tournament.start_date).getTime() - 30 * 60000).toLocaleString()} (Example)</span>
        </div>
        <div className="flex justify-between">
          <span>Room details shared:</span>
          <span>{new Date(new Date(tournament.start_date).getTime() - 15 * 60000).toLocaleString()} (Example)</span>
        </div>
        <div className="flex justify-between">
          <span>Tournament starts:</span>
          <span>{new Date(tournament.start_date).toLocaleString()}</span>
        </div>
      </div>
      
      <div className="bg-gaming-primary/10 border border-gaming-primary/20 rounded-md p-4 flex">
        <Info size={20} className="text-gaming-primary mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-semibold mb-1">Important Information</h4>
          <p className="text-sm text-gaming-muted">
            Please ensure all team members have the latest version of Free Fire installed. 
            You must join the custom room within 10 minutes of the scheduled start time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InfoTab; 