import React from "react";
import { Check, AlertCircle, Shield, Award, Ban, Info, BookOpen } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tournament } from "@/lib/tournamentService";
import { Badge } from "@/components/ui/badge";

interface RulesTabProps {
  tournament: Tournament;
}

const RulesTab: React.FC<RulesTabProps> = ({ tournament }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Tournament Rules</h2>
        <Badge variant="outline" className="bg-gaming-primary/10 text-gaming-primary border-gaming-primary/30">
          <BookOpen size={14} className="mr-1" /> Official Rules
        </Badge>
      </div>
      
      <div className="bg-gaming-primary/5 rounded-lg p-4 border border-gaming-primary/20">
        {tournament.rules ? (
          <ul className="space-y-0">
            {tournament.rules.split('\n').map((rule, index) => (
              <li key={index} className="flex items-start group hover:bg-gaming-primary/10 p-2 rounded-md transition-colors">
                <span className="w-2 h-2 rounded-full bg-orange-400 mt-2 mr-3 block flex-shrink-0"></span>
                <span className="text-orange-400 group-hover:text-white transition-colors">{rule}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center p-3 bg-gaming-bg/50 rounded-md">
            <Info size={18} className="text-gaming-muted mr-2" />
            <p className="text-gaming-muted italic">No specific rules provided for this tournament.</p>
          </div>
        )}
      </div>
      
      <Separator className="my-6 bg-gaming-primary/10" />
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-5 space-y-4">
        <div className="flex items-center">
          <Ban size={20} className="text-red-500 mr-3 flex-shrink-0" />
          <h4 className="font-semibold text-red-400 text-lg">Prohibited Actions</h4>
        </div>
        
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <li className="flex items-start bg-red-500/5 p-3 rounded-md">
            <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gaming-muted">Using unauthorized third-party apps or mods</span>
          </li>
          <li className="flex items-start bg-red-500/5 p-3 rounded-md">
            <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gaming-muted">Teaming with other squads during matches</span>
          </li>
          <li className="flex items-start bg-red-500/5 p-3 rounded-md">
            <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gaming-muted">Intentionally disconnecting to avoid elimination</span>
          </li>
          <li className="flex items-start bg-red-500/5 p-3 rounded-md">
            <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gaming-muted">Any form of harassment or toxic behavior</span>
          </li>
        </ul>
        
        <div className="bg-red-500/20 p-3 rounded-md text-sm text-white/70 flex items-center">
          <Info size={14} className="mr-2 text-red-300" />
          <span>Violation of these rules may result in disqualification without refund</span>
        </div>
      </div>
      
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-5">
        <div className="flex items-center mb-3">
          <Award size={20} className="text-green-400 mr-3 flex-shrink-0" />
          <h4 className="font-semibold text-green-400 text-lg">Fair Play Guidelines</h4>
        </div>
        
        <ul className="space-y-2 text-gaming-muted">
          <li className="flex items-center">
            <Check size={16} className="text-green-400 mr-2 flex-shrink-0" />
            <span>Report technical issues immediately to tournament admins</span>
          </li>
          <li className="flex items-center">
            <Check size={16} className="text-green-400 mr-2 flex-shrink-0" />
            <span>Be online at least 15 minutes before your scheduled match</span>
          </li>
          <li className="flex items-center">
            <Check size={16} className="text-green-400 mr-2 flex-shrink-0" />
            <span>Record or screenshot final results for verification</span>
          </li>
          <li className="flex items-center">
            <Check size={16} className="text-green-400 mr-2 flex-shrink-0" />
            <span>Respect all participants and tournament officials</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RulesTab; 