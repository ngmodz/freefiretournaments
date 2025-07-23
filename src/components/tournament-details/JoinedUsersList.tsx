import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile } from "@/lib/firebase/profile";
import { ClipboardCopy, User, AtSign, Hash, Users, Crown, UserCheck, Search, X } from 'lucide-react';

import { TeamParticipant } from "@/lib/types";
import { isDuoTeam } from "@/lib/teamService";

interface Participant {
  customUid: string;
  authUid: string;
  ign: string;
}

interface JoinedUsersListProps {
  participantUids: (string | Participant | TeamParticipant)[];
  tournamentMode?: "Solo" | "Duo" | "Squad";
}

interface UserProfile {
  id: string;
  uid: string;
  ign: string;
  email: string;
  _notFound?: boolean;
}

function CopyButton({ value, className }: { value: string, className?: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          return successful;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      alert(`Copy this text: ${value}`);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      title="Copy"
      className={`inline-flex items-center justify-center text-gaming-muted/70 hover:text-gaming-primary focus:outline-none transition-colors ${className || ''}`}
      whileTap={{ scale: 0.9 }}
    >
      <ClipboardCopy className="h-4 w-4" />
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-gaming-primary text-white text-xs rounded-md shadow-lg"
          >
            Copied!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const JoinedUsersList: React.FC<JoinedUsersListProps> = ({ participantUids, tournamentMode = "Solo" }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<TeamParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!participantUids || participantUids.length === 0) {
      setUsers([]);
      setTeams([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const processParticipants = async () => {
      try {
        const userProfiles: UserProfile[] = [];
        const teamParticipants: TeamParticipant[] = [];
        
        for (const participant of participantUids) {
          // Handle team participant format (Phase 1)
          if (typeof participant === 'object' && participant !== null && 'teamId' in participant) {
            const teamObj = participant as TeamParticipant;
            teamParticipants.push(teamObj);
          }
          // Handle individual participant format: participant is an object with {customUid, authUid, ign}
          else if (typeof participant === 'object' && participant !== null && 'customUid' in participant) {
            const participantObj = participant as Participant;
            try {
              // Fetch the user profile to get the email
              const profile = await getUserProfile(participantObj.authUid);
              userProfiles.push({
                id: participantObj.authUid,
                uid: participantObj.customUid,
                ign: participantObj.ign,
                email: profile.email,
                _notFound: false,
              });
            } catch (err) {
              // If profile not found, still show participant data without email
              userProfiles.push({
                id: participantObj.authUid,
                uid: participantObj.customUid,
                ign: participantObj.ign,
                email: "N/A",
                _notFound: true,
              });
            }
          }
          // Handle legacy format: participant is a string (authUid)
          else if (typeof participant === 'string') {
            try {
              const profile = await getUserProfile(participant);
              userProfiles.push({
                id: profile.id,
                uid: profile.uid,
                ign: profile.ign,
                email: profile.email,
              });
            } catch (err) {
              // If profile not found, still show UID
              userProfiles.push({
                id: participant,
                uid: participant,
                ign: "N/A",
                email: "N/A",
                _notFound: true,
              });
            }
          }
        }
        
        setUsers(userProfiles);
        setTeams(teamParticipants);
        setLoading(false);
      } catch (err) {
        setError("Failed to load joined participants.");
        setLoading(false);
      }
    };
    
    processParticipants();
  }, [participantUids]);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase().trim();
    return users.filter(user => 
      user.ign.toLowerCase().includes(term) ||
      user.uid.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Filter teams based on search term
  const filteredTeams = useMemo(() => {
    if (!searchTerm.trim()) return teams;
    
    const term = searchTerm.toLowerCase().trim();
    return teams.filter(team => {
      // Search in team name, tag, leader IGN/UID, and member IGN/UID
      const teamMatches = team.teamName.toLowerCase().includes(term) ||
                         team.teamTag.toLowerCase().includes(term) ||
                         team.leaderIgn.toLowerCase().includes(term) ||
                         team.leaderUid.toLowerCase().includes(term);
      
      const memberMatches = team.members.some(member =>
        member.ign.toLowerCase().includes(term) ||
        member.uid.toLowerCase().includes(term)
      );
      
      return teamMatches || memberMatches;
    });
  }, [teams, searchTerm]);

  const hasParticipants = users.length > 0 || teams.length > 0;
  const hasFilteredResults = filteredUsers.length > 0 || filteredTeams.length > 0;
  const totalParticipants = users.length + teams.reduce((sum, team) => sum + team.totalMembers, 0);
  const filteredTotalParticipants = filteredUsers.length + filteredTeams.reduce((sum, team) => sum + team.totalMembers, 0);
  
  // Handle loading state
  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center text-gaming-muted">
        <LoaderIcon className="animate-spin mb-2 h-8 w-8 text-gaming-primary" />
        Loading joined users...
      </div>
    );
  }

  // Handle error state
  if (error) {
    return <div className="py-8 text-rose-500 text-center">{error}</div>;
  }
  
  // Handle no participants
  if (!hasParticipants) {
    return (
      <div className="py-12 flex flex-col items-center text-gaming-muted">
        {tournamentMode === "Solo" ? (
          <User className="mb-2 h-10 w-10 opacity-50" />
        ) : (
          <Users className="mb-2 h-10 w-10 opacity-50" />
        )}
        <span>No {tournamentMode === "Solo" ? "users" : "teams"} have joined yet.</span>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-xl font-bold text-gaming-text flex items-center gap-2">
          {tournamentMode === "Solo" ? (
            <User className="h-6 w-6 text-gaming-primary"/>
          ) : (
            <Users className="h-6 w-6 text-gaming-primary"/>
          )}
          {tournamentMode === "Solo" ? "Joined Users" : "Joined Teams"}
          <span className="text-sm font-medium text-gaming-muted">
            {searchTerm ? (
              <>({filteredTotalParticipants} of {totalParticipants} players)</>
            ) : (
              <>({tournamentMode === "Solo" ? users.length : teams.length} {tournamentMode === "Solo" ? "users" : "teams"}, {totalParticipants} total players)</>
            )}
          </span>
        </h3>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gaming-muted" />
          </div>
          <input
            type="text"
            placeholder={`Search by ${tournamentMode === "Solo" ? "IGN or UID" : "team name, IGN, or UID"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-gaming-card border border-gaming-border rounded-lg text-gaming-text placeholder-gaming-muted focus:outline-none focus:ring-2 focus:ring-gaming-primary focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gaming-muted hover:text-gaming-primary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* No search results message */}
      {searchTerm && !hasFilteredResults && (
        <div className="py-12 flex flex-col items-center text-gaming-muted">
          <Search className="mb-2 h-10 w-10 opacity-50" />
          <span>No {tournamentMode === "Solo" ? "users" : "teams"} found matching "{searchTerm}"</span>
          <button
            onClick={() => setSearchTerm("")}
            className="mt-2 text-gaming-primary hover:text-gaming-primary/80 transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Render Teams for team tournaments */}
      {filteredTeams.length > 0 && (
        <div className="overflow-hidden">
          {/* Team List */}
          <AnimatePresence>
            <motion.div className="space-y-4">
              {filteredTeams.map((team, idx) => {
                const isDuo = team.totalMembers === 2;
                return (
                <motion.div
                  key={team.teamId}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.01, zIndex: 10, transition: { duration: 0.2 } }}
                  className={`bg-gradient-to-r from-gaming-card/80 to-gaming-card/60 border rounded-xl shadow-lg backdrop-blur-sm relative ${
                    isDuo
                      ? 'border-blue-400/40 shadow-blue-500/10'
                      : 'border-gaming-border/30'
                  }`}
                >
                  <div className="p-4">
                    {/* Team Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gaming-primary">{idx + 1}.</span>
                        <div className="flex items-center gap-2">
                          {isDuo ? (
                            <UserCheck className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Users className="h-5 w-5 text-gaming-primary" />
                          )}
                          <span className="font-bold text-gaming-text">{team.teamName}</span>
                          <span className="px-2 py-1 bg-gaming-primary/20 text-gaming-primary text-xs font-mono rounded">
                            [{team.teamTag}]
                          </span>
                          {isDuo && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                              DUO
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gaming-muted">
                        {team.totalMembers} players
                      </div>
                    </div>

                    {/* Team Leader */}
                    <div className="mb-3 p-3 bg-gaming-bg/30 rounded-lg border border-gaming-border/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gaming-text">Team Leader</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <AtSign className="h-3 w-3 text-gaming-muted" />
                          <span className="font-mono">{team.leaderIgn}</span>
                          <CopyButton value={team.leaderIgn} className="ml-auto" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Hash className="h-3 w-3 text-gaming-muted" />
                          <span className="font-mono">{team.leaderUid}</span>
                          <CopyButton value={team.leaderUid} className="ml-auto" />
                        </div>
                      </div>
                    </div>

                    {/* Team Members */}
                    {team.members.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-gaming-text mb-2">
                          {isDuo ? 'Teammate' : 'Team Members'}
                        </div>
                        <div className="space-y-2">
                          {team.members.map((member, memberIdx) => (
                            <div key={memberIdx} className={`p-2 rounded-md border ${
                              isDuo
                                ? 'bg-blue-500/10 border-blue-400/20'
                                : 'bg-gaming-bg/20 border-gaming-border/10'
                            }`}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <AtSign className="h-3 w-3 text-gaming-muted" />
                                  <span className="font-mono">{member.ign}</span>
                                  <CopyButton value={member.ign} className="ml-auto" />
                                </div>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-3 w-3 text-gaming-muted" />
                                  <span className="font-mono">{member.uid}</span>
                                  <CopyButton value={member.uid} className="ml-auto" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Render Individual Users for solo tournaments */}
      {filteredUsers.length > 0 && (
        <div className="overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[40px_1fr_1fr_1fr] gap-4 px-4 py-2 text-sm font-semibold text-gaming-muted uppercase tracking-wider items-center">
            <div className="text-center">#</div>
            <div>UID</div>
            <div>IGN</div>
            <div>Email</div>
          </div>

          {/* User List */}
          <AnimatePresence>
            <motion.div className="space-y-3">
              {filteredUsers.map((user, idx) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02, zIndex: 10, transition: { duration: 0.2 } }}
                  className="bg-gradient-to-r from-gaming-card/80 to-gaming-card/60 border border-gaming-border/30 rounded-xl shadow-lg backdrop-blur-sm relative"
                >
                  {/* Mobile Layout */}
                  <div className="p-4 md:hidden">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <span className="text-lg font-bold text-gaming-primary">{idx + 1}.</span>
                        <span className="font-semibold text-gaming-text truncate flex-grow pr-2">{user.ign}</span>
                        <CopyButton value={user.ign} className="ml-auto" />
                      </div>
                      {user._notFound && (
                        <div className="text-xs text-rose-400 px-2 py-1 bg-rose-500/10 rounded-full flex-shrink-0">Profile Missing</div>
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-4 w-4 text-gaming-muted"/>
                        <span className="font-mono flex-grow truncate pr-2">{user.uid}</span>
                        <CopyButton value={user.uid} className="ml-auto"/>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <AtSign className="h-4 w-4 text-gaming-muted"/>
                        <span className="truncate flex-grow pr-2">{user.email}</span>
                        <CopyButton value={user.email} className="ml-auto"/>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 items-center p-4">
                    <div className="font-mono text-gaming-muted text-center">{idx + 1}</div>
                    <div className="font-mono text-sm flex items-center">
                      <span className="truncate flex-grow pr-2">{user.uid}</span>
                      <CopyButton value={user.uid} className="flex-shrink-0" />
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="truncate flex-grow pr-2">{user.ign}</span>
                      <CopyButton value={user.ign} className="flex-shrink-0" />
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="truncate flex-grow pr-2 max-w-[220px]">{user.email}</span>
                      <CopyButton value={user.email} className="flex-shrink-0" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export default JoinedUsersList; 