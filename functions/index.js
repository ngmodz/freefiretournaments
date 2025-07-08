const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Cloud Function to automatically delete expired tournaments
exports.deleteExpiredTournaments = onSchedule("every 5 minutes", async (context) => {
  try {
    logger.info("Starting cleanup of expired tournaments");
    
    const now = new Date();
    const nowTimestamp = new Date(now.getTime());
    
    // Query for tournaments that have expired (ttl is in the past)
    const expiredTournamentsQuery = db.collection('tournaments')
      .where('ttl', '<=', nowTimestamp)
      .limit(100); // Process in batches
    
    const expiredTournaments = await expiredTournamentsQuery.get();
    
    if (expiredTournaments.empty) {
      logger.info("No expired tournaments found");
      return;
    }
    
    logger.info(`Found ${expiredTournaments.size} expired tournaments to delete`);
    
    // Delete expired tournaments in batches
    const batch = db.batch();
    let deletedCount = 0;
    
    expiredTournaments.forEach((doc) => {
      const tournamentData = doc.data();
      logger.info(`Deleting expired tournament: ${doc.id} - ${tournamentData.name}`);
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    // Commit the batch deletion
    await batch.commit();
    
    logger.info(`Successfully deleted ${deletedCount} expired tournaments`);
    
    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} expired tournaments`
    };
    
  } catch (error) {
    logger.error("Error deleting expired tournaments:", error);
    throw error;
  }
});

// Manual trigger for testing (HTTP endpoint)
exports.triggerTournamentCleanup = onRequest(async (req, res) => {
  try {
    logger.info("Manual tournament cleanup triggered");
    
    const now = new Date();
    const nowTimestamp = new Date(now.getTime());
    
    // Query for tournaments that have expired
    const expiredTournamentsQuery = db.collection('tournaments')
      .where('ttl', '<=', nowTimestamp)
      .limit(100);
    
    const expiredTournaments = await expiredTournamentsQuery.get();
    
    if (expiredTournaments.empty) {
      res.json({
        success: true,
        deletedCount: 0,
        message: "No expired tournaments found"
      });
      return;
    }
    
    // Delete expired tournaments
    const batch = db.batch();
    let deletedCount = 0;
    
    expiredTournaments.forEach((doc) => {
      const tournamentData = doc.data();
      logger.info(`Deleting expired tournament: ${doc.id} - ${tournamentData.name}`);
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} expired tournaments`
    });
    
  } catch (error) {
    logger.error("Error in manual tournament cleanup:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
exports.healthCheck = onRequest((req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Tournament cleanup service is running"
  });
});