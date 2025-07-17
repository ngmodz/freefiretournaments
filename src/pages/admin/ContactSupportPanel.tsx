import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { ArrowLeft, Eye, Trash2 } from 'lucide-react';
import styles from './hostpanel.module.css';
import withdrawStyles from './withdrawals.module.css';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found.');
        }
        const token = await user.getIdToken();

        const response = await fetch('/api/email-service?service=contact-submissions', {
          method: 'GET',
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
          createdAt: new Date(sub.createdAt),
          updatedAt: new Date(sub.updatedAt)
        }));

        setSubmissions(formattedSubmissions);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to load contact support submissions.', { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);
  
  const handleDelete = async () => {
    if (!submissionToDelete) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required.');
      const token = await user.getIdToken();

      const response = await fetch(`/api/email-service?service=contact-submissions&id=${submissionToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete submission.');
      }

      setSubmissions(submissions.filter(s => s.id !== submissionToDelete));
      toast.success('Submission deleted successfully.');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error(error.message);
    } finally {
      setShowDeleteConfirm(false);
      setSubmissionToDelete(null);
    }
  };

  const openDeleteConfirm = (submissionId: string) => {
    setSubmissionToDelete(submissionId);
    setShowDeleteConfirm(true);
  };

  const closeModal = () => {
    setSelectedSubmission(null);
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    const term = searchTerm.toLowerCase();
    if (!term) return true; // Show all if search term is empty

    const nameMatch = submission.name.toLowerCase().includes(term);
    const emailMatch = submission.email.toLowerCase().includes(term);
    const subjectMatch = submission.subject.toLowerCase().includes(term);
    const messagePreviewMatch = submission.message.toLowerCase().includes(term);

    return nameMatch || emailMatch || subjectMatch || messagePreviewMatch;
  });

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

      <div className={withdrawStyles.controls} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search submissions by email, name, or subject..."
          className={withdrawStyles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
            {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className={styles.tableRow} onClick={() => setSelectedSubmission(submission)}>
                <td data-label="Submitter">
                  <div className={styles.userInfo}>
                    <div className={styles.userDetails}>{submission.email}</div>
                  </div>
                </td>
                <td data-label="Subject">{submission.subject}</td>
                <td data-label="Message Preview">{submission.message.substring(0, 50)}...</td>
                <td data-label="Date">{submission.createdAt.toLocaleString()}</td>
                <td data-label="Status">
                  <span className={styles.statusBadge}>{submission.status}</span>
                </td>
                <td data-label="Actions" className={styles.actionsCell}>
                  <div className={styles.actionsContainer}>
                    <button className={styles.viewButton} onClick={(e) => { e.stopPropagation(); setSelectedSubmission(submission); }}>
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      className={styles.deleteIconButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(submission.id);
                      }}
                      title="Delete submission"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
                  <span>{selectedSubmission.createdAt.toLocaleString()}</span>
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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubmissionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactSupportPanel; 