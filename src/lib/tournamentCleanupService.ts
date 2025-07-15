import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp,
  writeBatch,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Client-side tournament cleanup service
 * This service can be called from the client to clean up expired tournaments
 * 
 * IMPORTANT: Tournaments now have TTL set automatically when they reach their scheduled start time
 * (via cloud function setTournamentTTLAtScheduledTime), regardless of whether the host starts them or not.
 */
export class TournamentCleanupService {
  
  /**
   * Delete expired tournaments from Firestore
   * @param maxBatchSize Maximum number of tournaments to delete in one batch
   * @returns Promise with cleanup results
   */
  static async deleteExpiredTournaments(maxBatchSize: number = 50) {
    try {
      console.log('🧹 Starting tournament cleanup process...');
      
      const now = Timestamp.now();
      
      // Query for tournaments that have expired (ttl is in the past)
      const expiredQuery = query(
        collection(db, 'tournaments'),
        where('ttl', '<=', now),
        limit(maxBatchSize)
      );
      
      const expiredTournaments = await getDocs(expiredQuery);
      
      // Also check for ended tournaments without TTL that should have expired
      const endedTournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'ended'),
        limit(maxBatchSize)
      );
      
      const endedTournaments = await getDocs(endedTournamentsQuery);

      // Also check for cancelled tournaments that might have a missing/invalid TTL
      const cancelledTournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'cancelled'),
        limit(maxBatchSize)
      );
      const cancelledTournaments = await getDocs(cancelledTournamentsQuery);
      
      // Filter ended tournaments without TTL that should have expired (30 minutes after ending)
      const expiredEndedTournaments = endedTournaments.docs.filter(doc => {
        const data = doc.data();
        if (data.ended_at && !data.ttl) {
          const endedAt = data.ended_at.toDate();
          const shouldExpireAt = new Date(endedAt.getTime() + 30 * 60 * 1000);
          return now.toDate() > shouldExpireAt;
        }
        return false;
      });
      
      // Filter cancelled tournaments that are more than 10 minutes old, regardless of TTL
      const expiredCancelledTournaments = cancelledTournaments.docs.filter(doc => {
        const data = doc.data();
        if (data.cancelled_at) {
          const cancelledAt = data.cancelled_at.toDate();
          const shouldExpireAt = new Date(cancelledAt.getTime() + 10 * 60 * 1000);
          return now.toDate() > shouldExpireAt;
        }
        // If no cancelled_at, but it is cancelled, and older than an hour, clean it up.
        if (data.created_at) {
          const createdAt = data.created_at.toDate();
          const shouldExpireAt = new Date(createdAt.getTime() + 60 * 60 * 1000);
          return now.toDate() > shouldExpireAt;
        }
        return false;
      });

      // Combine all sets of tournaments to delete
      const allExpiredTournaments = [
        ...expiredTournaments.docs, 
        ...expiredEndedTournaments,
        ...expiredCancelledTournaments
      ];
      
      if (allExpiredTournaments.length === 0) {
        console.log('✅ No expired tournaments found');
        return {
          success: true,
          deletedCount: 0,
          message: 'No expired tournaments to clean up'
        };
      }
      
      console.log(`🔍 Found ${allExpiredTournaments.length} expired tournaments to delete`);
      
      // Use batch write for better performance
      const batch = writeBatch(db);
      let deletedCount = 0;
      
      allExpiredTournaments.forEach((docSnap) => {
        const tournamentData = docSnap.data();
        console.log(`🗑️ Marking tournament for deletion: ${docSnap.id} - ${tournamentData.name}`);
        batch.delete(docSnap.ref);
        deletedCount++;
      });
      
      // Commit the batch deletion
      await batch.commit();
      
      console.log(`✅ Successfully deleted ${deletedCount} expired tournaments`);
      
      return {
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} expired tournaments`
      };
      
    } catch (error) {
      console.error('❌ Error during tournament cleanup:', error);
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check if there are any expired tournaments that need cleanup
   * @returns Promise with check results
   */
  static async checkForExpiredTournaments() {
    try {
      const now = Timestamp.now();
      
      // Query for tournaments that have expired (ttl is in the past)
      const expiredQuery = query(
        collection(db, 'tournaments'),
        where('ttl', '<=', now),
        limit(10) // Just check a few to see if any exist
      );
      
      const expiredTournaments = await getDocs(expiredQuery);
      
      // Also check for ended tournaments without TTL that should have expired
      const endedTournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'ended'),
        limit(10)
      );
      
      const endedTournaments = await getDocs(endedTournamentsQuery);
      
      // Filter ended tournaments without TTL that should have expired (30 minutes after ending)
      const expiredEndedTournaments = endedTournaments.docs.filter(doc => {
        const data = doc.data();
        if (data.ended_at && !data.ttl) {
          const endedAt = data.ended_at.toDate();
          const shouldExpireAt = new Date(endedAt.getTime() + 30 * 60 * 1000);
          return now.toDate() > shouldExpireAt;
        }
        return false;
      });
      
      const totalExpired = expiredTournaments.size + expiredEndedTournaments.length;
      
      return {
        hasExpired: totalExpired > 0,
        expiredCount: totalExpired,
        message: totalExpired > 0 ? `Found ${totalExpired} expired tournaments` : 'No expired tournaments found'
      };
      
    } catch (error) {
      console.error('❌ Error checking for expired tournaments:', error);
      return {
        hasExpired: false,
        expiredCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Initialize automatic cleanup on app start
   * This should be called when the app initializes
   */
  static async initializeCleanup() {
    try {
      // Check for expired tournaments on startup
      const expiredCheck = await this.checkForExpiredTournaments();
      
      if (expiredCheck.hasExpired) {
        console.log('🔄 Found expired tournaments on startup, cleaning up...');
        await this.deleteExpiredTournaments();
      }
      
      // Set up aggressive periodic cleanup every 30 seconds
      setInterval(async () => {
        const expiredCheck = await this.checkForExpiredTournaments();
        if (expiredCheck.hasExpired) {
          console.log('🔄 Periodic cleanup: Found expired tournaments, cleaning up...');
          await this.deleteExpiredTournaments();
        }
      }, 30 * 1000); // 30 seconds for fast cleanup
      
      console.log('✅ Tournament cleanup service initialized (30-second intervals)');
      
    } catch (error) {
      console.error('❌ Error initializing tournament cleanup:', error);
    }
  }
  
  /**
   * Start immediate aggressive cleanup mode
   * This runs cleanup every 10 seconds for faster deletion
   */
  static startAggressiveCleanup() {
    const aggressiveInterval = setInterval(async () => {
      try {
        const expiredCheck = await this.checkForExpiredTournaments();
        if (expiredCheck.hasExpired) {
          console.log('🚀 Aggressive cleanup: Found expired tournaments, cleaning up...');
          await this.deleteExpiredTournaments();
        }
      } catch (error) {
        console.error('❌ Error in aggressive cleanup:', error);
      }
    }, 10 * 1000); // 10 seconds for aggressive cleanup
    
    console.log('🚀 Aggressive tournament cleanup started (10-second intervals)');
    
    // Return the interval ID so it can be cleared if needed
    return aggressiveInterval;
  }
  
  /**
   * Start ultra-aggressive cleanup mode for immediate deletion
   * This runs cleanup every 5 seconds when tournaments are about to expire
   */
  static startUltraAggressiveCleanup() {
    let consecutiveEmptyChecks = 0;
    const maxEmptyChecks = 12; // Stop after 1 minute of no expired tournaments
    
    const ultraAggressiveInterval = setInterval(async () => {
      try {
        const expiredCheck = await this.checkForExpiredTournaments();
        
        if (expiredCheck.hasExpired) {
          console.log('⚡ Ultra-aggressive cleanup: Found expired tournaments, cleaning up...');
          await this.deleteExpiredTournaments();
          consecutiveEmptyChecks = 0; // Reset counter
        } else {
          consecutiveEmptyChecks++;
          
          // Stop ultra-aggressive mode after several consecutive empty checks
          if (consecutiveEmptyChecks >= maxEmptyChecks) {
            console.log('⚡ Ultra-aggressive cleanup: No expired tournaments found, stopping...');
            clearInterval(ultraAggressiveInterval);
          }
        }
      } catch (error) {
        console.error('❌ Error in ultra-aggressive cleanup:', error);
      }
    }, 5 * 1000); // 5 seconds for ultra-aggressive cleanup
    
    console.log('⚡ Ultra-aggressive tournament cleanup started (5-second intervals)');
    
    // Auto-stop after 5 minutes to prevent infinite running
    setTimeout(() => {
      clearInterval(ultraAggressiveInterval);
      console.log('⚡ Ultra-aggressive cleanup auto-stopped after 5 minutes');
    }, 5 * 60 * 1000);
    
    return ultraAggressiveInterval;
  }
}

export default TournamentCleanupService;
