import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/lib/adminService";
import { WithdrawalRequest, StatusFilter } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, QrCode, Crown, MessageSquare } from "lucide-react";
import styles from "./withdrawals.module.css";
import { getUserProfile } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';

// Import Inter font from Google Fonts
const interFontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

const TABS: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
  { label: "All", value: "all" },
];

const COMMISSION_RATE = 0.02; // 2%
const HIGHLIGHT_STYLE = { background: '#fff59d', borderRadius: '3px', padding: '0 2px' };
const FOCUS_HIGHLIGHT_STYLE = { background: '#ffe066', borderRadius: '3px', padding: '0 2px', outline: '2px solid #ffd700' };

function highlight(text: string, term: string, matchIndex: number, current: number, globalIndex: number, refs: any) {
  if (!term) return text;
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  let localMatch = 0;
  return parts.map((part, i) => {
    if (regex.test(part)) {
      const isCurrent = globalIndex + localMatch === current;
      const ref = isCurrent ? (el => { if (el) refs.current = el; }) : undefined;
      const el = <mark key={i} ref={ref} style={isCurrent ? FOCUS_HIGHLIGHT_STYLE : HIGHLIGHT_STYLE}>{part}</mark>;
      localMatch++;
      return el;
    }
    return part;
  });
}

export default function AdminPage() {
  // Dynamically inject Inter font link tag
  useEffect(() => {
    if (!document.getElementById("inter-font-link")) {
      const link = document.createElement("link");
      link.id = "inter-font-link";
      link.rel = "stylesheet";
      link.href = interFontUrl;
      document.head.appendChild(link);
    }
  }, []);

  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [currentMatch, setCurrentMatch] = useState(0);
  const matchRefs = useRef<any>(null);
  const [qrData, setQrData] = useState<{ upiId: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchWithdrawalRequests = async () => {
    try {
      setIsRefreshing(true);
      const data = await AdminService.getWithdrawalRequests();
      setRequests(data);
      setError(null);
    } catch (error) {
      setError("Failed to load withdrawal requests. Please try refreshing.");
      toast.error("Failed to load data", { description: "Could not fetch withdrawal requests." });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!currentUser) {
        navigate("/auth");
        return;
      }
      try {
        const adminStatus = await AdminService.checkAdminStatus(currentUser.uid);
        if (adminStatus) {
          setIsAdmin(true);
          await fetchWithdrawalRequests();
        } else {
          toast.error("Access Denied", { description: "You do not have permission to view this page." });
          navigate("/home");
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
        navigate("/home");
      } finally {
        setIsLoading(false);
      }
    };
    checkAdminAndFetchData();
  }, [currentUser, navigate]);

  const handleStatusChange = async (requestId: string, newStatus: "pending" | "done") => {
    try {
      await AdminService.updateWithdrawalStatus(requestId, newStatus);
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r)));
      toast.success(`Request marked as ${newStatus}`);
      if (newStatus === "done") {
        const request = requests.find((r) => r.id === requestId);
        if (request && request.userEmail && request.userId) {
          // Fetch user profile for UID
          const userProfile = await getUserProfile(request.userId);
          let uid = '';
          if (userProfile) {
            uid = userProfile.uid || '';
          }
          // Fetch user balance (wallet.earnings or balance)
          let balance = 0;
          try {
            const userDoc = await getDoc(doc(db, "users", request.userId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              balance = data.wallet?.earnings ?? data.balance ?? 0;
            }
          } catch {}
          await AdminService.sendWithdrawalNotification({
            userId: request.userId,
            userEmail: request.userEmail,
            userName: request.userName,
            upiId: request.upiId,
            amount: request.amount,
            balance,
            processedAt: Date.now(),
            notes: '' // Optionally add admin notes here
          });
          toast.info("Withdrawal notification sent to user.");
        }
      }
    } catch (error) {
      toast.error("Failed to update status. Please try again.");
    }
  };

  // Lowercase search term for matching
  const search = searchTerm.trim().toLowerCase();

  // Find all matches and their global indices
  let matchCount = 0;
  const filteredRequests = requests
    .filter((req) => statusFilter === "all" || req.status === statusFilter)
    .filter((req) => {
      if (!search) return true;
      return (
        req.userEmail?.toLowerCase().includes(search) ||
        req.upiId?.toLowerCase().includes(search) ||
        req.userName?.toLowerCase().includes(search)
      );
    });

  // Count all matches in the visible table
  const matchPositions: { row: number; col: string; index: number }[] = [];
  filteredRequests.forEach((req, rowIdx) => {
    [
      { val: 'N/A', col: 'userName' },
      { val: req.userEmail, col: 'userEmail' },
      { val: req.upiId || 'N/A', col: 'upiId' }
    ].forEach(({ val, col }) => {
      if (!search) return;
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      let m;
      let lastIndex = 0;
      while ((m = regex.exec(val))) {
        matchPositions.push({ row: rowIdx, col, index: lastIndex++ });
      }
    });
  });
  matchCount = matchPositions.length;

  // Scroll to the current match
  useEffect(() => {
    if (matchRefs.current) {
      matchRefs.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatch, search]);

  // Reset current match when search/filter changes
  useEffect(() => {
    setCurrentMatch(0);
  }, [search, statusFilter, requests]);

  if (isLoading) {
    return (
      <div className={styles.container} style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#8c8c8c' }} />
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  // Arrow button handlers
  const gotoPrev = () => setCurrentMatch((prev) => (prev - 1 + matchCount) % matchCount);
  const gotoNext = () => setCurrentMatch((prev) => (prev + 1) % matchCount);

  // Helper to get the global match index for a cell
  function getCellMatchIndex(rowIdx: number, col: string) {
    let idx = 0;
    for (let i = 0; i < matchPositions.length; ++i) {
      if (matchPositions[i].row === rowIdx && matchPositions[i].col === col) {
        return idx;
      }
      idx++;
    }
    return -1;
  }

  return (
    <div className={styles.container} style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={styles.card}>
        <div className={styles.headerActions}>
          <button 
            className={styles.hostApplicationsBtn} 
            onClick={() => navigate('/admin/host-applications')}
          >
            <Crown size={16} />
            Host Applications
          </button>
          <button 
            className={styles.hostApplicationsBtn} 
            onClick={() => navigate('/admin/contactsupport')}
          >
            <MessageSquare size={16} />
            Contact Support
          </button>
          <button className={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
        <h1 className={styles.title}>Withdrawal Requests</h1>
        <div className={styles.controls}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="text"
              placeholder="Search by email or UPI ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              style={{ marginRight: 6 }}
            />
            {search && matchCount > 0 && (
              <>
                <button onClick={gotoPrev} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#888', padding: 2 }} aria-label="Previous match">&#8592;</button>
                <span style={{ fontSize: 13, color: '#888', minWidth: 36, textAlign: 'center', display: 'inline-block' }}>{matchCount === 0 ? '0/0' : `${currentMatch + 1}/${matchCount}`}</span>
                <button onClick={gotoNext} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#888', padding: 2 }} aria-label="Next match">&#8594;</button>
              </>
            )}
          </div>
        </div>
        {error && (
          <div style={{ background: '#fff1f0', border: '1px solid #ffa39e', color: '#cf1322', padding: '12px 18px', borderRadius: 6, marginBottom: 16, fontWeight: 500, fontSize: 14 }}>
            {error}
          </div>
        )}
        <div className={styles.tableWrap}>
          <table>
            <colgroup>
              <col style={{ width: '23%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '110px' }} />
              <col style={{ width: '140px' }} />
            </colgroup>
            <thead>
              <tr>
                <th>USER</th>
                <th>AMOUNT</th>
                <th>UPI ID</th>
                <th>REQUESTED AT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, rowIdx) => {
                  const grossAmount = req.amount / (1 - COMMISSION_RATE);
                  // For each cell, pass the global match index and refs
                  let matchIdxUser = getCellMatchIndex(rowIdx, 'userName');
                  let matchIdxEmail = getCellMatchIndex(rowIdx, 'userEmail');
                  let matchIdxUpi = getCellMatchIndex(rowIdx, 'upiId');
                  return (
                    <tr key={req.id}>
                      <td>
                        <div className={styles.userName}>{highlight('N/A', search, matchIdxUser, currentMatch, matchIdxUser, matchRefs)}</div>
                        <div className={styles.userEmail}>{highlight(req.userEmail, search, matchIdxEmail, currentMatch, matchIdxEmail, matchRefs)}</div>
                        {req.userId && <UserBalance userId={req.userId} />}
                      </td>
                      <td>
                        <div className={styles.amountPayout}>₹{req.amount.toFixed(2)} <span style={{ fontWeight: 400, color: '#8c8c8c' }}>(Payout)</span></div>
                        <div className={styles.amountOriginal}>₹{grossAmount.toFixed(2)} (Original)</div>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {highlight(req.upiId || 'N/A', search, matchIdxUpi, currentMatch, matchIdxUpi, matchRefs)}
                          {req.upiId && (
                            <button
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                width: 28,
                                height: 28,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.15s',
                                padding: 0,
                              }}
                              title="Show QR for UPI ID"
                              onClick={() => setQrData({ upiId: req.upiId!, amount: req.amount })}
                              onMouseOver={e => (e.currentTarget.style.background = '#f3f3f3')}
                              onMouseOut={e => (e.currentTarget.style.background = 'none')}
                            >
                              <QrCode size={18} strokeWidth={2} color="#444" />
                            </button>
                          )}
                        </span>
                      </td>
                      <td>{new Date(req.timestamp).toLocaleString()}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${req.status === 'done' ? styles.statusDone : ''} ${req.status === 'pending' ? styles.statusPending : ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'pending' && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleStatusChange(req.id, 'done')}
                          >
                            Mark as Done
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '64px 0', color: '#8c8c8c' }}>
                    No requests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* QR Code Modal */}
      {qrData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', minWidth: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{ marginBottom: 16 }}>Scan to Pay</h3>
            <QRCodeCanvas value={`upi://pay?pa=${qrData.upiId}&am=${Math.floor(qrData.amount)}`} size={200} />
            <div style={{ margin: '16px 0 8px', fontSize: 15, color: '#333' }}>
              <b>
                <span
                  style={{ cursor: 'pointer', borderBottom: '1px dashed #888' }}
                  title="Click to copy UPI ID"
                  onClick={async () => {
                    await navigator.clipboard.writeText(qrData.upiId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {qrData.upiId}
                </span>
              </b>
              {copied && <span style={{ color: '#0a0', marginLeft: 8, fontSize: 13 }}>Copied!</span>}
            </div>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
              Amount: <b>₹{Math.floor(qrData.amount)}</b><br/>
              Scan this QR in Google Pay or any UPI app to pay this user.
            </div>
            <button onClick={() => setQrData(null)} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#222', color: '#fff', fontWeight: 500, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// UserBalance component fetches and displays the user's balance
import { useEffect as useEffect2, useState as useState2 } from "react";
function UserBalance({ userId }: { userId: string }) {
  const [balance, setBalance] = useState2<number | null>(null);
  useEffect2(() => {
    let mounted = true;
    async function fetchBalance() {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const bal = data.wallet?.earnings ?? data.balance ?? null;
          if (mounted) setBalance(bal);
        }
      } catch {
        if (mounted) setBalance(null);
      }
    }
    fetchBalance();
    return () => {
      mounted = false;
    };
  }, [userId]);
  if (balance === null) return null;
  return <div className={styles.userBalance + ' ' + styles.fadeIn}>Balance: ₹{balance.toFixed(2)}</div>;
} 