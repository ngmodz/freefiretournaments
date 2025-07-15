import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth } from "./firebase";
import { WithdrawalRequest } from "./types";

export const AdminService = {
  
  async checkAdminStatus(userId: string): Promise<boolean> {
    try {
      const user = await auth.currentUser;
      if (!user) {
        console.warn("No authenticated user found for admin check.");
        return false;
      }
      
      const idTokenResult = await user.getIdTokenResult(true); // Force refresh
      
      console.log("User claims:", idTokenResult.claims);
      
      return idTokenResult.claims.admin === true;

    } catch (error) {
      console.error("Error checking admin status from token:", error);
      
      // Fallback for safety, but primary check should be the token
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().isAdmin) {
            console.warn(`User ${userId} has admin field in Firestore but not in token. Consider re-setting claims.`);
            return true;
        }
      } catch (fbError) {
          console.error("Error in fallback Firestore check for admin:", fbError);
      }
      
      return false;
    }
  },

  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    try {
      const requestsCol = collection(db, "withdrawalRequests");
      // Add limit to the query to comply with security rules
      const q = query(requestsCol, orderBy("requestedAt", "desc"), limit(100));
      const snapshot = await getDocs(q);
      
      console.log(`Retrieved ${snapshot.docs.length} withdrawal requests`);
      
      const requests = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data();
          
          // Debug: Log the raw document data to see all fields
          console.log("Raw document data:", d.id, JSON.stringify(data, (key, value) => {
            // Handle Timestamp objects for logging
            if (value && typeof value.toDate === 'function') {
              return value.toDate().toString();
            }
            return value;
          }, 2));
          
          // Create a standardized request object with field mapping
          const request: WithdrawalRequest = {
            id: d.id,
            userId: data.userId || '',
            amount: data.amount || 0,
            // Map status values - keep original or default to 'pending'
            status: data.status === 'completed' ? 'done' : (data.status || 'pending'),
            // Handle different timestamp field names
            timestamp: data.requestedAt instanceof Timestamp 
              ? data.requestedAt.toMillis() 
              : (data.timestamp?.toMillis() || Date.now()),
            userEmail: data.userEmail || 'Loading...', // Placeholder
            userName: data.userName || 'Loading...', // Placeholder
            // Extract UPI ID from the correct field name - log it for debugging
            upiId: data.upiId || '',
          };

          console.log(`Extracted UPI ID for ${d.id}: "${data.upiId}"`);

          // Fetch user details
          try {
              const userDoc = await getDoc(doc(db, "users", request.userId));
              if(userDoc.exists()) {
                  const userData = userDoc.data();
                  request.userEmail = data.userEmail || userData.email || 'No Email';
                  request.userName = userData.name || userData.displayName || 'No Name';
              } else {
                  request.userName = "Unknown User";
                  request.userEmail = data.userEmail || "N/A";
              }
          } catch (error) {
              console.error(`Failed to fetch user data for request ${request.id}`, error);
              request.userName = "Error Loading User";
              request.userEmail = data.userEmail || "N/A";
          }
          
          console.log("Processed request:", JSON.stringify(request));
          return request;
        })
      );
      
      return requests;
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      throw error;
    }
  },

  async updateWithdrawalStatus(
    requestId: string,
    status: "pending" | "done"
  ): Promise<void> {
    // Map 'done' to 'completed' for database consistency
    const dbStatus = status === 'done' ? 'completed' : status;
    
    const requestDoc = doc(db, "withdrawalRequests", requestId);
    await updateDoc(requestDoc, { 
      status: dbStatus,
      processedAt: Timestamp.now()
    });
  },

  async sendWithdrawalNotification(
    request: {
      userId: string;
      userEmail: string;
      userName: string;
      upiId?: string;
      amount: number;
      balance: number;
      processedAt: number;
      notes?: string;
    }
  ): Promise<void> {
    try {
      // Call the backend REST API directly
      const response = await fetch('/api/withdrawal-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdrawal-notification',
          type: 'processed', // Specify the notification type
          userId: request.userId,
          userEmail: request.userEmail,
          userName: request.userName,
          upiId: request.upiId,
          amount: request.amount,
          remainingBalance: request.balance,
          processedAt: request.processedAt,
          status: 'completed',
          notes: request.notes || ''
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send withdrawal notification');
      }
    } catch (error) {
      console.error('Error sending withdrawal notification:', error);
      throw error;
    }
  },

  async updateHostApplicationStatus(applicationId: string, updateData: {
    status: 'approved' | 'rejected';
    reviewedAt: Date;
    reviewedBy?: string;
    reviewNotes?: string;
  }): Promise<void> {
    try {
      const applicationRef = doc(db, 'hostApplications', applicationId);
      await updateDoc(applicationRef, {
        status: updateData.status,
        reviewedAt: Timestamp.fromDate(updateData.reviewedAt),
        reviewedBy: updateData.reviewedBy,
        reviewNotes: updateData.reviewNotes,
      });
    } catch (error) {
      console.error('Error updating host application status:', error);
      throw error;
    }
  },

  async markWithdrawalAsDone(requestId: string): Promise<void> {
    try {
      await this.updateWithdrawalStatus(requestId, 'done');
    } catch (error) {
      console.error('Error marking withdrawal as done:', error);
      throw error;
    }
  },
};