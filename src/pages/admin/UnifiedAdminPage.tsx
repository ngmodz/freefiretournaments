import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/lib/adminService";
import { WithdrawalRequest, StatusFilter, HostApplication } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, QrCode, Crown, Users, DollarSign } from "lucide-react";
import styles from "./withdrawals.module.css";
import { getUserProfile, updateUserProfile } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { QRCodeCanvas } from 'qrcode.react';

// Import Inter font from Google Fonts
const interFontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

type AdminView = "withdrawals" | "hostApplications";

const WITHDRAWAL_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "pending" },
  { label: "Done", value: "done" },
  { label: "All", value: "all" },
];

const HOST_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
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
  
  // Common state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AdminView>("withdrawals");
  
  // Withdrawal state
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<StatusFilter>("pending");
  const [withdrawalSearchTerm, setWithdrawalSearchTerm] = useState("");
  const [withdrawalCurrentMatch, setWithdrawalCurrentMatch] = useState(0);
  const withdrawalMatchRefs = useRef<any>(null);
  
  // Host application state
  const [hostApplications, setHostApplications] = useState<HostApplication[]>([]);
  const [hostStatusFilter, setHostStatusFilter] = useState<StatusFilter>("pending");
  const [hostSearchTerm, setHostSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<HostApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize admin check
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
          await Promise.all([
            fetchWithdrawalRequests(),
            fetchHostApplications()
          ]);
        } else {
          toast.error("Access Denied", { description: "You do not have permission to view this page." });
          navigate("/home");
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error("An error occurred. Please try again.");
        navigate("/home");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [currentUser, navigate]);

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    try {
      const data = await AdminService.getWithdrawalRequests();
      setWithdrawalRequests(data);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      toast.error("Failed to load withdrawal requests");
    }
  };

  // Fetch host applications
  const fetchHostApplications = async () => {
    try {
      setIsRefreshing(true);
      const applicationsRef = collection(db, 'hostApplications');
      const q = query(applicationsRef, orderBy('submittedAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const data: HostApplication[] = [];
      
      for (const docSnap of snapshot.docs) {
        const appData = docSnap.data();
        
        // Fetch user profile for additional info
        let userProfile = null;
        try {
          userProfile = await getUserProfile(appData.userId);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
        
        data.push({
          id: docSnap.id,
          userId: appData.userId,
          userEmail: appData.userEmail,
          experience: appData.experience,
          reason: appData.reason,
          preferredGameModes: appData.preferredGameModes || '',
          availability: appData.availability || '',
          contactInfo: appData.contactInfo || '',
          status: appData.status,
          submittedAt: appData.submittedAt,
          reviewedAt: appData.reviewedAt,
          reviewedBy: appData.reviewedBy,
          reviewNotes: appData.reviewNotes || '',
          // Additional user data
          userName: userProfile?.fullName || userProfile?.displayName || 'Unknown',
          userUid: userProfile?.uid || 'N/A',
          userIgn: userProfile?.ign || 'N/A',
        });
      }
      
      setHostApplications(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching host applications:', error);
      setError("Failed to load host applications. Please try refreshing.");
      toast.error("Failed to load data", { description: "Could not fetch host applications." });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle host application status change
  const handleHostStatusChange = async (applicationId: string, newStatus: "approved" | "rejected", notes?: string) => {
    try {
      const application = hostApplications.find(app => app.id === applicationId);
      if (!application) return;

      await AdminService.updateHostApplicationStatus(applicationId, {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: currentUser?.uid,
        reviewNotes: notes || '',
      });

      // If approved, grant host privileges and send an email
      if (newStatus === 'approved') {
        if (application.userId) {
          await updateUserProfile(application.userId, { isHost: true });
          toast.success('Host privileges have been granted.');
        }

        try {
          const response = await fetch('/api/send-host-approval-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: application.userEmail,
              name: application.userName || 'User',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to send approval email');
          }

          toast.success('Approval email sent successfully.');

        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          toast.error('Failed to send approval email', {
            description: 'The application status was updated, but the approval email could not be sent.',
          });
        }
      } else if (newStatus === 'rejected') {
        // If rejected, revoke host privileges if they existed
        if (application.userId) {
          await updateUserProfile(application.userId, { isHost: false });
          toast.info('Host privileges have been revoked.');
        }
      }

      // Update local state
      setHostApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status: newStatus,
                reviewedAt: Timestamp.fromDate(new Date()),
                reviewedBy: currentUser?.uid,
                reviewNotes: notes || '',
              }
            : app
        )
      );

      setSelectedApplication(null);
      setReviewNotes("");
      toast.success(`Application ${newStatus}`, { description: `The host application has been ${newStatus}.` });
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error("Failed to update status", { description: "Please try again." });
    }
  };

  // Filter functions
  const filteredWithdrawals = withdrawalRequests.filter((request) => {
    const matchesStatus = withdrawalStatusFilter === "all" || request.status === withdrawalStatusFilter;
    const matchesSearch = !withdrawalSearchTerm ||
      request.userEmail?.toLowerCase().includes(withdrawalSearchTerm.toLowerCase()) ||
      request.upiId?.toLowerCase().includes(withdrawalSearchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredHostApplications = hostApplications.filter((app) => {
    const matchesStatus = hostStatusFilter === "all" || app.status === hostStatusFilter;
    const matchesSearch = !hostSearchTerm ||
      app.userName?.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      app.userIgn?.toLowerCase().includes(hostSearchTerm.toLowerCase()) ||
      app.experience.toLowerCase().includes(hostSearchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleWithdrawalMarkAsDone = async (requestId: string) => {
    try {
      await AdminService.markWithdrawalAsDone(requestId);
      await fetchWithdrawalRequests();
      toast.success("Request marked as done!");
    } catch (error) {
      console.error('Error marking withdrawal as done:', error);
      toast.error("Failed to update request");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin h-8 w-8" />
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.icon}>
            {currentView === "withdrawals" ? <DollarSign size={32} /> : <Crown size={32} />}
          </div>
          <div>
            <h1 className={styles.title}>
              {currentView === "withdrawals" ? "Withdrawal Requests" : "Host Applications Panel"}
            </h1>
            <p className={styles.subtitle}>
              {currentView === "withdrawals" 
                ? "Review and manage withdrawal requests" 
                : "Review and manage host applications"
              }
            </p>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${currentView === "withdrawals" ? styles.active : ""}`}
              onClick={() => setCurrentView("withdrawals")}
            >
              <DollarSign size={16} />
              Withdrawals
            </button>
            <button
              className={`${styles.toggleButton} ${currentView === "hostApplications" ? styles.active : ""}`}
              onClick={() => setCurrentView("hostApplications")}
            >
              <Crown size={16} />
              Host Applications
            </button>
          </div>
          
          <button className={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {currentView === "withdrawals" ? (
        <WithdrawalRequestsView
          requests={filteredWithdrawals}
          statusFilter={withdrawalStatusFilter}
          setStatusFilter={setWithdrawalStatusFilter}
          searchTerm={withdrawalSearchTerm}
          setSearchTerm={setWithdrawalSearchTerm}
          onMarkAsDone={handleWithdrawalMarkAsDone}
          currentMatch={withdrawalCurrentMatch}
          setCurrentMatch={setWithdrawalCurrentMatch}
          matchRefs={withdrawalMatchRefs}
        />
      ) : (
        <HostApplicationsView
          applications={filteredHostApplications}
          statusFilter={hostStatusFilter}
          setStatusFilter={setHostStatusFilter}
          searchTerm={hostSearchTerm}
          setSearchTerm={setHostSearchTerm}
          onStatusChange={handleHostStatusChange}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
          reviewNotes={reviewNotes}
          setReviewNotes={setReviewNotes}
          onRefresh={fetchHostApplications}
          isRefreshing={isRefreshing}
          error={error}
        />
      )}
    </div>
  );
}

// Withdrawal Requests Component
function WithdrawalRequestsView({ 
  requests, 
  statusFilter, 
  setStatusFilter, 
  searchTerm, 
  setSearchTerm, 
  onMarkAsDone,
  currentMatch,
  setCurrentMatch,
  matchRefs
}: {
  requests: WithdrawalRequest[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onMarkAsDone: (requestId: string) => void;
  currentMatch: number;
  setCurrentMatch: (match: number) => void;
  matchRefs: any;
}) {
  return (
    <>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by email or UPI ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tabs}>
        {WITHDRAWAL_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${statusFilter === tab.value ? styles.activeTab : ""}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            <span className={styles.count}>
              {requests.filter(r => tab.value === "all" || r.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
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
            {requests.map((request) => (
              <WithdrawalRequestRow
                key={request.id}
                request={request}
                searchTerm={searchTerm}
                onMarkAsDone={onMarkAsDone}
                currentMatch={currentMatch}
                matchRefs={matchRefs}
              />
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className={styles.emptyState}>
            <DollarSign size={48} className={styles.emptyIcon} />
            <h3>No withdrawal requests found</h3>
            <p>There are no withdrawal requests matching your current filters.</p>
          </div>
        )}
      </div>
    </>
  );
}

// Host Applications Component  
function HostApplicationsView({
  applications,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  onStatusChange,
  selectedApplication,
  setSelectedApplication,
  reviewNotes,
  setReviewNotes,
  onRefresh,
  isRefreshing,
  error
}: {
  applications: HostApplication[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onStatusChange: (id: string, status: "approved" | "rejected", notes?: string) => void;
  selectedApplication: HostApplication | null;
  setSelectedApplication: (app: HostApplication | null) => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  error: string | null;
}) {
  return (
    <>
      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search by name, email, IGN, or application..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button 
          onClick={onRefresh}
          disabled={isRefreshing}
          className={styles.refreshButton}
        >
          {isRefreshing ? <Loader2 className="animate-spin" size={16} /> : "Refresh"}
        </button>
      </div>

      <div className={styles.tabs}>
        {HOST_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`${styles.tab} ${statusFilter === tab.value ? styles.activeTab : ""}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            <span className={styles.count}>
              {applications.filter(app => tab.value === "all" || app.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      <div className={styles.applicationsGrid}>
        {applications.map((application) => (
          <HostApplicationCard
            key={application.id}
            application={application}
            onSelect={setSelectedApplication}
            searchTerm={searchTerm}
          />
        ))}

        {applications.length === 0 && !error && (
          <div className={styles.emptyState}>
            <Crown size={48} className={styles.emptyIcon} />
            <h3>No applications found</h3>
            <p>There are no host applications matching your current filters.</p>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <HostApplicationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onStatusChange={onStatusChange}
          reviewNotes={reviewNotes}
          setReviewNotes={setReviewNotes}
        />
      )}
    </>
  );
}

// Withdrawal Request Row Component
function WithdrawalRequestRow({ 
  request, 
  searchTerm, 
  onMarkAsDone,
  currentMatch,
  matchRefs
}: {
  request: WithdrawalRequest;
  searchTerm: string;
  onMarkAsDone: (requestId: string) => void;
  currentMatch: number;
  matchRefs: any;
}) {
  const [showQR, setShowQR] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (request.userId) {
        try {
          const profile = await getUserProfile(request.userId);
          setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };
    fetchUserProfile();
  }, [request.userId]);

  const payoutAmount = request.amount - (request.amount * COMMISSION_RATE);

  return (
    <tr>
      <td>
        <div className={styles.userInfo}>
          <div>
            <strong>{userProfile?.displayName || userProfile?.fullName || 'N/A'}</strong>
            <div className={styles.userEmail}>
              {highlight(request.userEmail || 'microff1007@gmail.com', searchTerm, 0, currentMatch, 0, matchRefs)}
            </div>
            <div className={styles.balance}>Balance: ₹{userProfile?.walletBalance || '500.00'}</div>
          </div>
        </div>
      </td>
      <td>
        <div className={styles.amountInfo}>
          <div className={styles.payout}>₹{payoutAmount.toFixed(2)} (Payout)</div>
          <div className={styles.original}>₹{request.amount.toFixed(2)} (Original)</div>
        </div>
      </td>
      <td>
        <div className={styles.upiInfo}>
          {highlight(request.upiId || '', searchTerm, 0, currentMatch, 0, matchRefs)}
          <button
            className={styles.qrButton}
            onClick={() => setShowQR(!showQR)}
            title="Show QR Code"
          >
            <QrCode size={16} />
          </button>
          {showQR && (
            <div className={styles.qrOverlay}>
              <div className={styles.qrContainer}>
                <QRCodeCanvas value={request.upiId || ''} size={150} />
                <button onClick={() => setShowQR(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </td>
      <td>{request.timestamp ? new Date(request.timestamp).toLocaleString() : 'N/A'}</td>
      <td>
        <span className={`${styles.status} ${styles[request.status]}`}>
          {request.status === 'pending' ? 'Pending' : 'Done'}
        </span>
      </td>
      <td>
        {request.status === 'pending' && (
          <button
            className={styles.actionButton}
            onClick={() => onMarkAsDone(request.id)}
          >
            Mark as Done
          </button>
        )}
      </td>
    </tr>
  );
}

// Host Application Card Component
function HostApplicationCard({
  application,
  onSelect,
  searchTerm
}: {
  application: HostApplication;
  onSelect: (app: HostApplication) => void;
  searchTerm: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  return (
    <div className={styles.applicationCard} onClick={() => onSelect(application)}>
      <div className={styles.cardHeader}>
        <div className={styles.userIcon}>
          <Users size={24} />
        </div>
        <div className={styles.cardInfo}>
          <h3>{highlight(application.userName, searchTerm, 0, 0, 0, null)}</h3>
          <p className={styles.cardSubtext}>
            IGN: {highlight(application.userIgn || 'N/A', searchTerm, 0, 0, 0, null)} • 
            UID: {application.userUid}
          </p>
        </div>
        <div 
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(application.status) }}
        >
          {getStatusLabel(application.status)}
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.cardField}>
          <span className={styles.fieldLabel}>Email:</span>
          <span>{highlight(application.userEmail, searchTerm, 0, 0, 0, null)}</span>
        </div>
        <div className={styles.cardField}>
          <span className={styles.fieldLabel}>Experience:</span>
          <span>{highlight(application.experience, searchTerm, 0, 0, 0, null)}</span>
        </div>
        <div className={styles.cardField}>
          <span className={styles.fieldLabel}>Submitted:</span>
          <span>{application.submittedAt ? new Date(application.submittedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

// Host Application Modal Component
function HostApplicationModal({
  application,
  onClose,
  onStatusChange,
  reviewNotes,
  setReviewNotes
}: {
  application: HostApplication;
  onClose: () => void;
  onStatusChange: (id: string, status: "approved" | "rejected", notes?: string) => void;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
}) {
  const handleApprove = () => {
    onStatusChange(application.id, "approved", reviewNotes);
  };

  const handleReject = () => {
    onStatusChange(application.id, "rejected", reviewNotes);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Host Application Details</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalContent}>
          <div className={styles.applicationDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Applicant:</span>
              <span>{application.userName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email:</span>
              <span>{application.userEmail}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>IGN:</span>
              <span>{application.userIgn}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>UID:</span>
              <span>{application.userUid}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Experience:</span>
              <span>{application.experience}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Reason:</span>
              <span>{application.reason}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Preferred Game Modes:</span>
              <span>{application.preferredGameModes || 'N/A'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Availability:</span>
              <span>{application.availability || 'N/A'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Contact Info:</span>
              <span>{application.contactInfo || 'N/A'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Submitted:</span>
              <span>{application.submittedAt ? new Date(application.submittedAt.seconds * 1000).toLocaleString() : 'N/A'}</span>
            </div>
            {application.reviewedAt && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Reviewed:</span>
                  <span>{new Date(application.reviewedAt.seconds * 1000).toLocaleString()}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Review Notes:</span>
                  <span>{application.reviewNotes || 'No notes'}</span>
                </div>
              </>
            )}
          </div>

          {application.status === 'pending' && (
            <div className={styles.reviewSection}>
              <h3>Review Application</h3>
              <textarea
                className={styles.reviewNotesInput}
                placeholder="Add review notes (optional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
              <div className={styles.reviewActions}>
                <button 
                  className={styles.approveButton}
                  onClick={handleApprove}
                >
                  Approve Application
                </button>
                <button 
                  className={styles.rejectButton}
                  onClick={handleReject}
                >
                  Reject Application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
