import React, { useEffect, useState } from "react";
import { getUserProfile } from "@/lib/firebase/profile";

interface JoinedUsersListProps {
  participantUids: string[];
}

interface UserProfile {
  id: string;
  uid: string;
  ign: string;
  email: string;
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
    Promise.all(
      participantUids.map(async (uid) => {
        try {
          const profile = await getUserProfile(uid);
          return {
            id: profile.id,
            uid: profile.uid,
            ign: profile.ign,
            email: profile.email,
          };
        } catch (err) {
          return null;
        }
      })
    )
      .then((results) => {
        setUsers(results.filter(Boolean) as UserProfile[]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load joined users.");
        setLoading(false);
      });
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
              <div>
                <span className="font-semibold text-gaming-muted">UID:</span>
                <span className="ml-2 font-mono text-sm">{user.uid}</span>
              </div>
              <div>
                <span className="font-semibold text-gaming-muted">IGN:</span>
                <span className="ml-2 text-sm">{user.ign}</span>
              </div>
              <div>
                <span className="font-semibold text-gaming-muted">Email:</span>
                <span className="ml-2 text-sm">{user.email}</span>
              </div>
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
                  <td className="px-4 py-2 font-mono text-sm whitespace-pre-wrap break-all">{user.uid}</td>
                  <td className="px-4 py-2 text-sm whitespace-pre-wrap break-all">{user.ign}</td>
                  <td className="px-4 py-2 text-sm whitespace-pre-wrap break-all">{user.email}</td>
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