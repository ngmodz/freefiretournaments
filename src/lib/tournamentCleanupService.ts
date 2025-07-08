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
      
      if (expiredTournaments.empty) {
        console.log('✅ No expired tournaments found');
        return {
          success: true,
          deletedCount: 0,
          message: 'No expired tournaments to clean up'
        };
      }
      
      console.log(`🔍 Found ${expiredTournaments.size} expired tournaments to delete`);
      
      // Use batch write for better performance
      const batch = writeBatch(db);
      let deletedCount = 0;
      
      expiredTournaments.forEach((docSnap) => {
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
   * Check if any tournaments are expired and need cleanup
   * @returns Promise with expiration check results
   */
  static async checkForExpiredTournaments() {
    try {
      const now = Timestamp.now();
      
      // Query for tournaments that have expired
      const expiredQuery = query(
        collection(db, 'tournaments'),
        where('ttl', '<=', now),
        limit(1) // Just check if any exist
      );
      
      const expiredTournaments = await getDocs(expiredQuery);
      
      return {
        hasExpired: !expiredTournaments.empty,
        count: expiredTournaments.size
      };
      
    } catch (error) {
      console.error('Error checking for expired tournaments:', error);
      return {
        hasExpired: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get tournaments that will expire soon (within next hour)
   * @returns Promise with soon-to-expire tournaments
   */
  static async getTournamentsExpiringSoon() {
    try {
      const now = Timestamp.now();
      const oneHourFromNow = Timestamp.fromDate(new Date(now.toDate().getTime() + 60 * 60 * 1000));
      
      // Query for tournaments expiring within the next hour
      const soonToExpireQuery = query(
        collection(db, 'tournaments'),
        where('ttl', '>', now),
        where('ttl', '<=', oneHourFromNow),
        limit(100)
      );
      
      const soonToExpire = await getDocs(soonToExpireQuery);
      
      const tournaments = soonToExpire.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        tournaments,
        count: tournaments.length
      };
      
    } catch (error) {
      console.error('Error getting tournaments expiring soon:', error);
      return {
        success: false,
        tournaments: [],
        count: 0,
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
