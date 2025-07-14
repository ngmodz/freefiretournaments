import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { ArrowLeft, Eye } from 'lucide-react';
import styles from './hostpanel.module.css';
import withdrawStyles from './withdrawals.module.css';
import { toast } from 'sonner';

interface Submission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: {
    toDate: () => Date;
  };
  status: string;
}

const ContactSupportPanel: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found.');
        }
        const token = await user.getIdToken();

        const response = await fetch('/api/get-contact-submissions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submissions.');
        }

        const result = await response.json();
        
        // Convert Firestore timestamps
        const formattedSubmissions = result.data.map(sub => ({
          ...sub,
          createdAt: new Date(sub.createdAt._seconds * 1000)
        }));

        setSubmissions(formattedSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load contact support submissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);
  
  const closeModal = () => {
    setSelectedSubmission(null);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Admin
          </button>
          <h1 className={styles.title}>Contact Support Submissions</h1>
        </div>
        <div className={styles.loadingState}>Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => navigate('/admin')} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Admin
        </button>
        <h1 className={styles.title}>Contact Support Submissions</h1>
      </div>

      <div className={withdrawStyles.tableWrapper}>
        <table className={withdrawStyles.table}>
          <thead>
            <tr>
              <th>Submitter</th>
              <th>Subject</th>
              <th>Message Preview</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className={styles.tableRow} onClick={() => setSelectedSubmission(submission)}>
                <td>
                  <div className={styles.userInfo}>
                    <div>{submission.name}</div>
                    <div className={styles.userDetails}>{submission.email}</div>
                  </div>
                </td>
                <td>{submission.subject}</td>
                <td>{submission.message.substring(0, 50)}...</td>
                <td>{new Date(submission.createdAt).toLocaleString()}</td>
                <td>
                  <span className={styles.statusBadge}>{submission.status}</span>
                </td>
                <td>
                  <button className={styles.viewButton} onClick={(e) => { e.stopPropagation(); setSelectedSubmission(submission); }}>
                    <Eye size={14} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <div className={withdrawStyles.modalOverlay} onClick={closeModal}>
          <div className={withdrawStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={withdrawStyles.modalHeader}>
              <h2>Submission Details</h2>
              <button className={withdrawStyles.closeButton} onClick={closeModal}>×</button>
            </div>
            <div className={withdrawStyles.modalContent}>
              <div className={withdrawStyles.applicationDetails}>
                <div className={withdrawStyles.detailRow}>
                  <span className={withdrawStyles.detailLabel}>From:</span>
                  <span>{selectedSubmission.name} ({selectedSubmission.email})</span>
                </div>
                <div className={withdrawStyles.detailRow}>
                  <span className={withdrawStyles.detailLabel}>Date:</span>
                  <span>{new Date(selectedSubmission.createdAt).toLocaleString()}</span>
                </div>
                <div className={withdrawStyles.detailRow}>
                  <span className={withdrawStyles.detailLabel}>Subject:</span>
                  <span>{selectedSubmission.subject}</span>
                </div>
                <div className={withdrawStyles.detailRow}>
                  <span className={withdrawStyles.detailLabel}>Message:</span>
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '4px', lineHeight: '1.6' }}>
                    {selectedSubmission.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSupportPanel; 