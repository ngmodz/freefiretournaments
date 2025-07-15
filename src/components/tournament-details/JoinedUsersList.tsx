import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserProfile } from "@/lib/firebase/profile";
import { ClipboardCopy, User, AtSign, Hash } from 'lucide-react';

interface Participant {
  customUid: string;
  authUid: string;
  ign: string;
}

interface JoinedUsersListProps {
  participantUids: (string | Participant)[];
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

const JoinedUsersList: React.FC<JoinedUsersListProps> = ({ participantUids }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!participantUids || participantUids.length === 0) {
      setUsers([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const processParticipants = async () => {
      try {
        const userProfiles: UserProfile[] = [];
        
        for (const participant of participantUids) {
          // Handle new format: participant is an object with {customUid, authUid, ign}
          if (typeof participant === 'object' && participant !== null && 'customUid' in participant) {
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
        setLoading(false);
      } catch (err) {
        setError("Failed to load joined users.");
        setLoading(false);
      }
    };
    
    processParticipants();
  }, [participantUids]);

  if (loading) return (
    <div className="py-8 flex flex-col items-center text-gaming-muted">
      <LoaderIcon className="animate-spin mb-2 h-8 w-8 text-gaming-primary" />
      Loading joined users...
    </div>
  );
  if (error) return <div className="py-8 text-rose-500 text-center">{error}</div>;
  if (!users.length) return (
    <div className="py-12 flex flex-col items-center text-gaming-muted">
      <User className="mb-2 h-10 w-10 opacity-50" />
      <span>No users have joined yet.</span>
    </div>
  );

  return (
    <div className="mt-8 w-full">
      <h3 className="text-xl font-bold mb-4 text-gaming-text flex items-center gap-2">
        <User className="h-6 w-6 text-gaming-primary"/>
        Joined Users 
        <span className="text-sm font-medium text-gaming-muted">({users.length})</span>
      </h3>
      
      {/* Unified Card Layout for all screen sizes */}
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
            {users.map((user, idx) => (
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
                  <div className="flex justify-between items-center"> {/* Changed items-start to items-center here */}
                    <div className="flex items-center gap-3 flex-grow min-w-0"> {/* Added flex-grow min-w-0 */}
                      <span className="text-lg font-bold text-gaming-primary">{idx + 1}.</span>
                      <span className="font-semibold text-gaming-text truncate flex-grow pr-2">{user.ign}</span> {/* Added pr-2 and flex-grow, removed min-w-0 */}
                      <CopyButton value={user.ign} className="ml-auto" />
                    </div>
                    {user._notFound && (
                      <div className="text-xs text-rose-400 px-2 py-1 bg-rose-500/10 rounded-full flex-shrink-0">Profile Missing</div>
                    )}
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-gaming-muted"/>
                      <span className="font-mono flex-grow truncate pr-2">{user.uid}</span> {/* Added pr-2, removed min-w-0 */}
                      <CopyButton value={user.uid} className="ml-auto"/>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AtSign className="h-4 w-4 text-gaming-muted"/>
                      <span className="truncate flex-grow pr-2">{user.email}</span> {/* Added pr-2, removed max-w-[200px] and min-w-0 */}
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