import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HostApplication } from '../../lib/types';
import { ArrowLeft, Eye, Check, X, Crown } from 'lucide-react';
import styles from './hostpanel.module.css';
import { updateUserProfile } from '../../lib/firebase/profile';
import { toast } from 'sonner';

interface ApplicationRowProps {
  application: HostApplication;
  onClick: () => void;
}

const ApplicationRow: React.FC<ApplicationRowProps> = ({ application, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'rgb(16, 185, 129)'; // This will be overridden by CSS
      case 'rejected':
        return 'rgb(239, 68, 68)'; // This will be overridden by CSS
      default:
        return 'rgb(245, 158, 11)'; // This will be overridden by CSS
    }
  };

  return (
    <tr className={styles.tableRow} onClick={onClick}>
      <td>
        <div className={styles.userInfo}>
          <Crown size={16} />
          <div>
            <div>{application.userName || application.userEmail}</div>
            <div className={styles.userDetails}>
              Applied: {application.submittedAt && application.submittedAt.toDate().toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
          </div>
        </div>
      </td>
      <td>
        <div className={styles.contactInfo}>
          <div>{application.userEmail}</div>
          {application.contactInfo && <div className={styles.contactDetails}>{application.contactInfo}</div>}
        </div>
      </td>
      <td>
        <div className={styles.experiencePreview}>
          {application.experience.length > 100 
            ? `${application.experience.substring(0, 100)}...`
            : application.experience
          }
        </div>
      </td>
      <td>
        <span 
          className={styles.statusBadge}
          style={{ backgroundColor: getStatusColor(application.status) }}
        >
          {application.status}
        </span>
      </td>
      <td>
        <button className={styles.viewButton}>
          <Eye size={14} />
          View Details
        </button>
      </td>
    </tr>
  );
};

const HostPanel: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<HostApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<HostApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch applications
  useEffect(() => {
    const applicationsRef = collection(db, 'hostApplications');
    const q = query(applicationsRef, orderBy('submittedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps: HostApplication[] = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() } as HostApplication);
      });
      setApplications(apps);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (updating) return;

    setSelectedApplication(null); // Close dialog immediately
    setUpdating(true);
    try {
      const application = applications.find(app => app.id === applicationId);
      const previousStatus = application?.status;
      const applicationRef = doc(db, 'hostApplications', applicationId);
      await updateDoc(applicationRef, {
        status,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes.trim() || null
      });

      // If changing from approved to rejected, remove host privileges
      if (previousStatus === 'approved' && status === 'rejected' && application?.userId) {
        await updateUserProfile(application.userId, { isHost: false });
        toast.success('Host privileges have been revoked.');
      }
      // If approving, grant host privileges
      if (status === 'approved' && application?.userId) {
        await updateUserProfile(application.userId, { isHost: true });
        toast.success('Host privileges have been granted.');
      }

      setReviewNotes('');
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update status', { description: 'An error occurred while updating the application status. Please check the console for details.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleApplicationClick = (application: HostApplication) => {
    setSelectedApplication(application);
    setReviewNotes('');
  };

  const closeModal = () => {
    setSelectedApplication(null);
    setReviewNotes('');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Withdrawals
          </button>
          <h1 className={styles.title}>Host Applications</h1>
        </div>
        <div className={styles.loadingState}>Loading applications...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/admin')} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Withdrawals
        </button>
        <h1 className={styles.title}>Host Applications</h1>
      </div>

      {applications.length === 0 ? (
        <div className={styles.emptyState}>
          <Crown size={48} />
          <h3>No Host Applications</h3>
          <p>No host applications have been submitted yet.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onClick={() => handleApplicationClick(application)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedApplication && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Review Application</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.applicationDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <p className={styles.detailText}>{selectedApplication.userName || selectedApplication.userEmail}</p>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <p className={styles.detailText}>{selectedApplication.userEmail}</p>
                </div>
                {selectedApplication.contactInfo && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Contact:</span>
                    <p className={styles.detailText}>{selectedApplication.contactInfo}</p>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Experience:</span>
                  <p className={styles.detailText}>{selectedApplication.experience}</p>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Reason:</span>
                  <p className={styles.detailText}>{selectedApplication.reason}</p>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Applied:</span>
                  <p className={styles.detailText}>
                    {new Date(selectedApplication.submittedAt.toDate()).toLocaleString()}
                  </p>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Current Status:</span>
                  <p className={styles.detailText}>
                    <span 
                      className={styles.statusBadge}
                      style={{ 
                        backgroundColor: selectedApplication.status === 'approved' ? 'rgb(16, 185, 129)' : 
                                        selectedApplication.status === 'rejected' ? 'rgb(239, 68, 68)' : 'rgb(245, 158, 11)'
                      }}
                    >
                      {selectedApplication.status}
                    </span>
                  </p>
                </div>
              </div>

              {selectedApplication.status === 'pending' && (
                <div className={styles.reviewSection}>
                  <div className={styles.reviewActions}>
                    <button
                      className={styles.approveButton}
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                      disabled={updating}
                    >
                      <Check size={16} /> Approve
                    </button>
                    <button
                      className={styles.rejectButton}
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                      disabled={updating}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              )}
              {selectedApplication.status === 'rejected' && (
                <div className={styles.reviewSection}>
                  <div className={styles.reviewActions}>
                    <button
                      className={styles.approveButton}
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                      disabled={updating}
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                </div>
              )}
              {selectedApplication.status === 'approved' && (
                <div className={styles.reviewSection}>
                  <div className={styles.reviewActions}>
                    <button
                      className={styles.rejectButton}
                      onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                      disabled={updating}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostPanel;
