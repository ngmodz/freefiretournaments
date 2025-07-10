// Public notification endpoint specifically designed for external cron services
// This endpoint uses a different approach to bypass Vercel's authentication

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig, debugEnvironment } from './firebase-config-helper.js';

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const emailConfig = getEmailConfig();

// Email transporter
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

async function sendTournamentNotifications() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notifications: 0, errors: [], checked: 0 };
  
  try {
    const emailTransporter = createTransporter();
    
    // Get current time in IST
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(Date.now() + istOffset);
    
    // Query active tournaments
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
      
      if (!tournament.host_id) {
        results.errors.push(`Tournament ${tournamentId} has no host_id`);
        continue;
      }
      
      // Skip if notification already sent
      if (tournament.notificationSent) {
        continue;
      }
      
      // Skip if notification sent recently (duplicate protection)
      if (tournament.notificationSentAt) {
        const notificationTime = tournament.notificationSentAt.toDate ? 
          tournament.notificationSentAt.toDate() : 
          new Date(tournament.notificationSentAt);
        const timeSinceNotification = (istNow.getTime() - notificationTime.getTime()) / (1000 * 60);
        
        if (timeSinceNotification < 30) {
          continue;
        }
      }
      
      // Calculate notification timing
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      // Check if tournament is in notification window (19-21 minutes)
      if (minutesToStart < 19 || minutesToStart > 21) {
        continue;
      }
      
      console.log(`Sending notification for tournament ${tournamentId}`);
      
      // Get host data
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
      
      // Send notification
      const mailOptions = {
        from: `"Tournament Host" <${emailConfig.user}>`,
        to: hostData.email,
        subject: `🏆 Tournament "${tournament.name}" Starts in 20 Minutes!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6200EA; text-align: center;">🏆 Tournament Starting Soon!</h1>
            <p>Hello Tournament Host,</p>
            <p>Your tournament <strong>${tournament.name}</strong> is starting in approximately 20 minutes!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #6200EA; margin-top: 0;">${tournament.name}</h2>
              <p><strong>Start Time:</strong> ${startDate.toLocaleString('en-US', { 
                timeZone: 'Asia/Kolkata',
                hour: 'numeric', 
                minute: 'numeric', 
                hour12: true,
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}</p>
              <p><strong>Mode:</strong> ${tournament.mode}</p>
              <p><strong>Map:</strong> ${tournament.map}</p>
              <p><strong>Room Type:</strong> ${tournament.room_type}</p>
              <p><strong>Participants:</strong> ${tournament.filled_spots || 0}/${tournament.max_players}</p>
            </div>
            
            <h3 style="color: #6200EA;">⏰ Action Required:</h3>
            <ul style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">
              <li>Create the game room now</li>
              <li>Share room ID and password with participants</li>
              <li>Ensure all game settings match tournament requirements</li>
              <li>Be ready to start exactly on time</li>
            </ul>
            
            <p style="text-align: center; margin-top: 30px;">
              <strong>Good luck with your tournament! 🎮</strong>
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
              This is an automated reminder. Please do not reply to this email.
            </div>
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
        console.error(`Failed to send email to ${hostData.email}:`, error);
        results.errors.push(`Failed to send email to ${hostData.email}: ${error.message}`);
      }
    }
    
    if (results.notifications === 0 && results.errors.length === 0) {
      results.message = `Checked ${results.checked} tournaments, none in notification window`;
    }
    
  } catch (error) {
    console.error('Error in notification process:', error);
    results.success = false;
    results.errors.push(`Error: ${error.message}`);
  }
  
  return results;
}

// Export handler that works with external cron services
export default async function handler(req, res) {
  // Set comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Notification check started via ${req.method}`);
  
  try {
    // Simple API key check
    const apiKey = req.headers['x-api-key'] || req.query.key || req.query.apikey;
    const expectedKey = process.env.API_KEY || 'tournament-notify-2025-secure-key-943827';
    
    if (apiKey !== expectedKey) {
      console.log('Invalid API key provided');
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid API key' 
      });
    }
    
    const results = await sendTournamentNotifications();
    const duration = Date.now() - startTime;
    
    console.log(`[${new Date().toISOString()}] Notification check completed in ${duration}ms:`, results);
    
    return res.status(200).json({
      ...results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] Notification check failed after ${duration}ms:`, error);
    
    return res.status(500).json({ 
      success: false,
      error: error.message,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}
