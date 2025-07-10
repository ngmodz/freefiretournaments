// Webhook endpoint for tournament notifications
// This endpoint is designed to be called by external services like cron-job.org
// It uses API key authentication instead of Vercel's default authentication

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig, debugEnvironment } from './firebase-config-helper.js';

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const emailConfig = getEmailConfig();

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send notifications for tournaments that will start in the next 24 hours
 */
async function sendTournamentNotifications() {
  console.log('Environment details:', debugEnvironment());
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    configValid: !!(firebaseConfig.apiKey && firebaseConfig.projectId)
  });
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notifications: 0, errors: [], checked: 0 };
  
  try {
    const emailTransporter = createTransporter();
    
    // Get current time in IST
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(Date.now() + istOffset);
    console.log('Current IST time:', istNow.toLocaleString());
    
    // Query for active tournaments
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const tournamentDocs = await getDocs(tournamentsQuery);
    results.checked = tournamentDocs.size;
    
    console.log(`Found ${results.checked} active tournaments`);
    
    for (const tournamentDoc of tournamentDocs.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      console.log(`Processing tournament: ${tournamentId} - "${tournament.name}"`);
      
      if (!tournament.host_id) {
        results.errors.push(`Tournament ${tournamentId} has no host_id`);
        continue;
      }
      
      // Skip if notification already sent
      if (tournament.notificationSent) {
        console.log(`Notification already sent for tournament ${tournamentId}`);
        continue;
      }
      
      // Additional duplicate check
      if (tournament.notificationSentAt) {
        const notificationTime = tournament.notificationSentAt.toDate ? 
          tournament.notificationSentAt.toDate() : 
          new Date(tournament.notificationSentAt);
        const timeSinceNotification = (istNow.getTime() - notificationTime.getTime()) / (1000 * 60);
        
        if (timeSinceNotification < 30) {
          console.log(`Notification sent ${timeSinceNotification.toFixed(1)} minutes ago for tournament ${tournamentId}`);
          continue;
        }
      }
      
      // Calculate notification timing
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes`);
      
      // Check if tournament is in the notification window (19-21 minutes before start)
      if (minutesToStart < 19 || minutesToStart > 21) {
        console.log(`Tournament ${tournamentId} outside notification window (19-21 minutes)`);
        continue;
      }
      
      console.log(`Tournament ${tournamentId} in notification window, sending notification`);
      
      // Get host user data
      const hostDocRef = doc(db, 'users', tournament.host_id);
      const hostDocSnapshot = await getDoc(hostDocRef);
      
      if (!hostDocSnapshot.exists()) {
        results.errors.push(`Host user ${tournament.host_id} not found`);
        continue;
      }
      
      const hostData = hostDocSnapshot.data();
      if (!hostData.email) {
        results.errors.push(`Host user ${tournament.host_id} has no email`);
        continue;
      }
      
      // Send notification email
      const mailOptions = {
        from: `"Tournament Host" <${emailConfig.user}>`,
        to: hostData.email,
        subject: `🏆 Reminder: Your Tournament "${tournament.name}" Starts Soon!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
            <p>Hello Tournament Host,</p>
            <p>Your tournament <strong>${tournament.name}</strong> starts in about 20 minutes!</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="color: #6200EA;">${tournament.name}</h2>
              <p><strong>Start Time:</strong> ${startDate.toLocaleString()}</p>
              <p><strong>Mode:</strong> ${tournament.mode}</p>
              <p><strong>Map:</strong> ${tournament.map}</p>
              <p><strong>Participants:</strong> ${tournament.filled_spots || 0}/${tournament.max_players}</p>
            </div>
            <p>Don't forget to create the room and share details with participants!</p>
            <p>Good luck!</p>
          </div>
        `
      };
      
      try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`Successfully sent notification to ${hostData.email}`);
        
        // Mark notification as sent
        await updateDoc(doc(db, 'tournaments', tournamentId), {
          notificationSent: true,
          notificationSentAt: Timestamp.now()
        });
        
        results.notifications++;
      } catch (error) {
        results.errors.push(`Failed to send email to ${hostData.email}: ${error.message}`);
      }
    }
    
    if (results.notifications === 0 && results.errors.length === 0) {
      results.message = `Checked ${results.checked} tournaments, none needed notifications`;
    }
    
  } catch (error) {
    results.success = false;
    results.errors.push(`Error: ${error.message}`);
  }
  
  return results;
}

// Webhook handler
export default async function handler(req, res) {
  console.log('Webhook called:', new Date().toISOString());
  
  // Set CORS headers to allow external access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // API key authentication
    const apiKey = req.headers['x-api-key'] || req.query.key || req.body?.key;
    
    if (!apiKey) {
      return res.status(401).json({ 
        success: false,
        error: 'API key required. Provide via x-api-key header or key parameter.'
      });
    }
    
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid API key.'
      });
    }
    
    console.log('API key validated, processing notifications...');
    
    const results = await sendTournamentNotifications();
    
    console.log('Webhook processing completed:', results);
    return res.status(200).json(results);
    
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
