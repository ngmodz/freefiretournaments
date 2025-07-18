import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { ArrowLeft, Eye, Trash2, ThumbsUp } from 'lucide-react';
import styles from './hostpanel.module.css';
import withdrawStyles from './withdrawals.module.css';
import cardStyles from './feedbackCard.module.css';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface Feedback {
  id: string;
  name: string;
  email: string;
  category: string;
  feedback: string;
  createdAt: {
    toDate: () => Date;
  };
  status: string;
  uid: string | null;
}

// Custom styles for the feedback panel
const customStyles = {
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    margin: '0 auto',
    position: 'relative' as const,
    padding: '24px',
    zIndex: 1000
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '16px',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#2c2c2c',
    margin: 0
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#8c8c8c',
    padding: '0',
    lineHeight: '1'
  },
  detailRow: {
    marginBottom: '18px'
  },
  detailLabel: {
    fontWeight: 500,
    color: '#8c8c8c',
    marginBottom: '6px',
    fontSize: '14px',
    display: 'block'
  },
  detailContent: {
    color: '#2c2c2c',
    fontSize: '16px',
    wordBreak: 'break-word' as const,
  },
  feedbackText: {
    whiteSpace: 'pre-wrap' as const, 
    lineHeight: '1.6', 
    fontSize: '15px',
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #f0f0f0'
  },
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  }
};

const FeedbackPanel: React.FC = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user found.');
        }
        const token = await user.getIdToken();

        const response = await fetch('/api/email-service?service=feedback-submissions', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch feedback submissions.');
        }

        const result = await response.json();
        
        // Convert Firestore timestamps
        const formattedFeedbacks = result.data.map(fb => ({
          ...fb,
          createdAt: new Date(fb.createdAt),
          updatedAt: fb.updatedAt ? new Date(fb.updatedAt) : null
        }));

        setFeedbacks(formattedFeedbacks);
      } catch (error) {
        console.error('Error fetching feedback submissions:', error);
        toast.error('Failed to load feedback submissions.', { duration: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);
  
  const handleDelete = async () => {
    if (!feedbackToDelete) return;

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Authentication required.');
      const token = await user.getIdToken();

      const response = await fetch(`/api/email-service?service=feedback-submissions&id=${feedbackToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete feedback.');
      }

      setFeedbacks(feedbacks.filter(f => f.id !== feedbackToDelete));
      toast.success('Feedback deleted successfully.');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error(error.message);
    } finally {
      setShowDeleteConfirm(false);
      setFeedbackToDelete(null);
    }
  };

  const openDeleteConfirm = (feedbackId: string) => {
    setFeedbackToDelete(feedbackId);
    setShowDeleteConfirm(true);
  };

  const closeModal = () => {
    setSelectedFeedback(null);
  };

  // Filter feedbacks based on search term
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const term = searchTerm.toLowerCase();
    if (!term) return true; // Show all if search term is empty

    const nameMatch = feedback.name.toLowerCase().includes(term);
    const emailMatch = feedback.email.toLowerCase().includes(term);
    const categoryMatch = feedback.category.toLowerCase().includes(term);
    const feedbackTextMatch = feedback.feedback.toLowerCase().includes(term);

    return nameMatch || emailMatch || categoryMatch || feedbackTextMatch;
  });

  const getCategoryLabel = (category: string) => {
    const categories = {
      'ui': 'User Interface',
      'tournaments': 'Tournaments',
      'payments': 'Payments & Withdrawals',
      'bugs': 'Bug Reports',
      'features': 'Feature Requests',
      'other': 'Other'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getCategoryClass = (category: string) => {
    const classes = {
      'ui': withdrawStyles.categoryUI,
      'tournaments': withdrawStyles.categoryTournaments,
      'payments': withdrawStyles.categoryPayments,
      'bugs': withdrawStyles.categoryBugs,
      'features': withdrawStyles.categoryFeatures,
      'other': withdrawStyles.categoryOther
    };
    return classes[category as keyof typeof classes] || withdrawStyles.categoryOther;
  }

  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className={withdrawStyles.container} style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className={withdrawStyles.card} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className={styles.loadingState}>Loading feedback submissions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={withdrawStyles.container} style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={withdrawStyles.card}>
        <div className={styles.header}>
          <button onClick={() => navigate('/admin')} className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Admin
          </button>
          <div className={withdrawStyles.titleSection}>
            <div className={withdrawStyles.icon}>
              <ThumbsUp size={28} />
            </div>
            <div>
              <h1 className={withdrawStyles.title}>User Feedback</h1>
              <p className={withdrawStyles.subtitle}>Review and manage user feedback</p>
            </div>
          </div>
        </div>

        <div className={withdrawStyles.controls}>
          <input
            type="text"
            placeholder="Search feedback..."
            className={withdrawStyles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isMobile ? (
          <div className={styles.applicationsList}>
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((feedback) => (
                <div key={feedback.id} className={cardStyles.card} onClick={() => setSelectedFeedback(feedback)}>
                  <div className={cardStyles.row}>
                    <span className={cardStyles.label}>User</span>
                    <div className={cardStyles.value}>
                      <div className={cardStyles.userName}>{feedback.name}</div>
                      <div className={cardStyles.userEmail}>{feedback.email}</div>
                    </div>
                  </div>
                  <div className={cardStyles.row}>
                    <span className={cardStyles.label}>Category</span>
                    <div className={cardStyles.value}>
                      <span className={`${withdrawStyles.categoryBadge} ${getCategoryClass(feedback.category)}`}>
                        {getCategoryLabel(feedback.category)}
                      </span>
                    </div>
                  </div>
                  <div className={cardStyles.row}>
                    <span className={cardStyles.label}>Feedback</span>
                    <div className={cardStyles.value}>{feedback.feedback.substring(0, 25)}...</div>
                  </div>
                  <div className={cardStyles.row}>
                    <span className={cardStyles.label}>Date</span>
                    <div className={cardStyles.value}>{new Date(feedback.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className={cardStyles.row}>
                    <span className={cardStyles.label}>Actions</span>
                    <div className={`${cardStyles.value} ${cardStyles.actions}`}>
                      <button className={cardStyles.viewButton} onClick={(e) => { e.stopPropagation(); setSelectedFeedback(feedback); }}>
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                      <button
                        className={cardStyles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteConfirm(feedback.id);
                        }}
                        title="Delete feedback"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>{searchTerm ? "No feedback matching your search" : "No feedback submissions yet"}</p>
              </div>
            )}
          </div>
        ) : (
          <div className={withdrawStyles.tableWrap}>
            <table className={withdrawStyles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Category</th>
                  <th>Feedback Preview</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length > 0 ? (
                  filteredFeedbacks.map((feedback) => (
                    <tr key={feedback.id} onClick={() => setSelectedFeedback(feedback)}>
                      <td data-label="User">
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>{feedback.name}</div>
                          <div className={styles.userDetails}>{feedback.email}</div>
                        </div>
                      </td>
                      <td data-label="Category">
                        <span className={`${withdrawStyles.categoryBadge} ${getCategoryClass(feedback.category)}`}>
                          {getCategoryLabel(feedback.category)}
                        </span>
                      </td>
                      <td data-label="Feedback Preview">
                        <div className={styles.experiencePreview}>
                          {feedback.feedback.substring(0, 50)}...
                        </div>
                      </td>
                      <td data-label="Date">
                        {feedback.createdAt.toLocaleString(undefined, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </td>
                      <td data-label="Actions" className={styles.actionsCell}>
                        <div className={styles.actionsContainer}>
                          <button className={styles.viewButton} onClick={(e) => { e.stopPropagation(); setSelectedFeedback(feedback); }}>
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            className={styles.deleteIconButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteConfirm(feedback.id);
                            }}
                            title="Delete feedback"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className={styles.emptyState}>
                      {searchTerm ? "No feedback matching your search" : "No feedback submissions yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {selectedFeedback && (
          <div style={customStyles.overlay} onClick={closeModal}>
            <div style={customStyles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={customStyles.modalHeader}>
                <h2 style={customStyles.modalTitle}>Feedback Details</h2>
                <button style={customStyles.closeButton} onClick={closeModal}>&times;</button>
              </div>
              <div>
                <div>
                  <div style={customStyles.detailRow}>
                    <span style={customStyles.detailLabel}>From</span>
                    <div style={customStyles.detailContent}>
                      <strong>{selectedFeedback.name}</strong>
                      <br />
                      <span style={{ color: '#8c8c8c', fontSize: '14px'}}>{selectedFeedback.email}</span>
                    </div>
                  </div>
                  <div style={customStyles.detailRow}>
                    <span style={customStyles.detailLabel}>Date</span>
                    <div style={customStyles.detailContent}>
                      {selectedFeedback.createdAt.toLocaleString(undefined, { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: false 
                      })}
                    </div>
                  </div>
                  <div style={customStyles.detailRow}>
                    <span style={customStyles.detailLabel}>Category</span>
                    <div style={customStyles.detailContent}>
                      <span className={`${withdrawStyles.categoryBadge} ${getCategoryClass(selectedFeedback.category)}`}>
                        {getCategoryLabel(selectedFeedback.category)}
                      </span>
                    </div>
                  </div>
                  <div style={customStyles.detailRow}>
                    <span style={customStyles.detailLabel}>Feedback</span>
                    <div style={customStyles.detailContent}>
                      <p style={customStyles.feedbackText}>
                        {selectedFeedback.feedback}
                      </p>
                    </div>
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
                This action cannot be undone. This will permanently delete the feedback.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setFeedbackToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FeedbackPanel; 