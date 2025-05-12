import React from "react";
import { Check, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tournament } from "@/lib/tournamentService";

interface RulesTabProps {
  tournament: Tournament;
}

const RulesTab: React.FC<RulesTabProps> = ({ tournament }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tournament Rules</h2>
      {tournament.rules ? (
        <ul className="space-y-3">
          {tournament.rules.split('\n').map((rule, index) => (
            <li key={index} className="flex items-start">
              <div className="bg-gaming-primary/20 p-1 rounded-md mr-3 mt-0.5">
                <Check size={16} className="text-gaming-primary" />
              </div>
              <span className="text-gaming-muted">{rule}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-gaming-muted">No specific rules provided for this tournament.</p>}
      
      <Separator className="my-6" />
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 flex">
        <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-semibold mb-1 text-red-400">Prohibited Actions</h4>
          <ul className="text-sm text-gaming-muted space-y-2">
            <li>Using unauthorized third-party apps or mods</li>
            <li>Teaming with other squads during matches</li>
            <li>Intentionally disconnecting to avoid elimination</li>
            <li>Any form of harassment or toxic behavior</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RulesTab; 