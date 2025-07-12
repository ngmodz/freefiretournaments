import React, { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firebase/profile";
import { ClipboardCopyIcon } from '@radix-ui/react-icons';

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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = async (text: string) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers and iOS
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
      setTimeout(() => setCopied(false), 1000);
    } else {
      // Fallback: show the text in an alert for manual copying
      alert(`Copy this text: ${value}`);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="inline-flex items-center justify-center mr-1 text-gaming-muted hover:text-gaming-primary focus:outline-none"
      style={{ fontSize: '1em', verticalAlign: 'middle' }}
      tabIndex={0}
    >
      <ClipboardCopyIcon />
      <span className="sr-only">Copy</span>
      {copied && (
        <span className="ml-1 text-xs text-gaming-primary">Copied!</span>
      )}
    </button>
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
            userProfiles.push({
              id: participantObj.authUid,
              uid: participantObj.customUid,
              ign: participantObj.ign,
              email: "N/A", // We don't have email in the participant object
              _notFound: false,
            });
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

  if (loading) return <div className="py-4 text-gaming-muted">Loading joined users...</div>;
  if (error) return <div className="py-4 text-red-500">{error}</div>;
  if (!users.length) return <div className="py-4 text-gaming-muted">No users have joined yet.</div>;

  return (
    <div className="mt-8 w-full">
      <h3 className="text-lg font-semibold mb-3">Joined Users</h3>
      {/* Mobile: vertical cards */}
      <div className="space-y-4 block sm:hidden">
        {users.map((user, idx) => (
          <div
            key={user.id}
            className="bg-gaming-card border border-gaming-border rounded-lg p-4 shadow-sm flex flex-col gap-2"
          >
            <div className="font-bold text-gaming-primary mb-2">{idx + 1}.</div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <span className="font-semibold text-gaming-muted">UID:</span>
                <span className="ml-2 font-mono text-sm">{user.uid}</span>
                <CopyButton value={user.uid} />
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gaming-muted">IGN:</span>
                <span className="ml-2 text-sm">{user.ign}</span>
                <CopyButton value={user.ign} />
              </div>
              <div className="flex items-center">
                <span className="font-semibold text-gaming-muted">Email:</span>
                <span className="ml-2 text-sm">{user.email}</span>
                <CopyButton value={user.email} />
              </div>
              {user._notFound && (
                <div className="text-xs text-red-400 mt-1">User profile not found</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: horizontal table */}
      <div className="hidden sm:block w-full">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gaming-card border border-gaming-border rounded-lg text-left shadow-md">
            <thead>
              <tr className="bg-gaming-primary/10 text-gaming-primary uppercase text-xs tracking-wider">
                <th className="px-4 py-2 font-semibold w-12">#</th>
                <th className="px-4 py-2 font-semibold">UID</th>
                <th className="px-4 py-2 font-semibold">IGN</th>
                <th className="px-4 py-2 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => (
                <tr key={user.id} className={idx % 2 === 0 ? "bg-gaming-bg/80" : "bg-gaming-card/80"}>
                  <td className="px-4 py-2 font-mono text-gaming-muted text-sm">{idx + 1}</td>
                  <td className="px-4 py-2 font-mono text-sm whitespace-pre-wrap break-all">
                    {user.uid}
                    <CopyButton value={user.uid} />
                  </td>
                  <td className="px-4 py-2 text-sm whitespace-pre-wrap break-all">
                    {user.ign}
                    <CopyButton value={user.ign} />
                  </td>
                  <td className="px-4 py-2 text-sm whitespace-pre-wrap break-all">
                    {user.email}
                    <CopyButton value={user.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default JoinedUsersList; 