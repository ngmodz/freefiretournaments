import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig } from './firebase-config-helper.js';

// --- Single, top-level Firebase initialization ---
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ---

// --- Email Configuration ---
const emailConfig = getEmailConfig();
const emailUser = emailConfig.user;
const emailPass = emailConfig.pass;

// --- Helper functions ---
function toIndianTime(date) {
  // Create a new date object with the correct IST time
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

const createTransporter = () => {
  if (!emailUser || !emailPass) {
    console.error('Email configuration missing. Cannot create transporter.');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false }
  });
};
// ---

async function sendEmail(mailOptions) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Failed to create email transporter.');
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email:`, error);
    throw error;
  }
}

async function sendTestEmail() {
  console.log('Test email requested...');
  try {
    const mailOptions = {
      from: `"Test Email" <${emailUser}>`,
      to: emailUser,
      subject: `🧪 Test Email from Tournament System - ${new Date().toISOString()}`,
      html: `<p>This is a test email to verify that the notification system is working correctly.</p>`
    };
    const info = await sendEmail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// This function processes a tournament without using transactions
async function processTournament(tournamentDoc) {
  const tournamentId = tournamentDoc.id;
  const tournament = tournamentDoc.data();

  try {
    // Skip if not active
    if (tournament.status !== 'active') {
      return { success: true, emailSent: false, tournamentId, reason: 'not-active' };
    }
    
    // Skip if notification already sent (based on data, not trying to update)
    if (tournament.notificationSent === true) {
      return { success: true, emailSent: false, tournamentId, reason: 'already-sent' };
    }
    
    // Use memory to track which tournaments we've processed in this run
    // This helps prevent duplicate emails within the same execution
    if (global.processedTournaments && global.processedTournaments.includes(tournamentId)) {
      return { success: true, emailSent: false, tournamentId, reason: 'already-processed-in-memory' };
    }
    
    // --- Use Indian Standard Time ---
    const now = toIndianTime(new Date());
    console.log(`[${tournamentId}] Current IST time: ${now.toISOString()}`);
    
    // Robust date handling
    let startDate;
    if (tournament.start_date?.toDate) { // It's a Firestore Timestamp
      startDate = tournament.start_date.toDate();
    } else if (tournament.start_date instanceof Date) { // It's already a JS Date
      startDate = tournament.start_date;
    } else { // It's likely a string or number, try parsing it
      startDate = new Date(tournament.start_date);
    }
    
    // Check if parsing resulted in a valid date
    if (isNaN(startDate.getTime())) {
      console.error(`[${tournamentId}] Invalid start_date format:`, tournament.start_date);
      return { success: false, emailSent: false, tournamentId, error: 'Invalid date format' };
    }
    
    console.log(`[${tournamentId}] Tournament start time: ${startDate.toISOString()}`);
    
    const minutesToStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
    console.log(`[${tournamentId}] Starts in ${minutesToStart.toFixed(1)} minutes (IST).`);

    // Check if tournament is in notification window
    if (minutesToStart < 15 || minutesToStart > 25) {
      return { success: true, emailSent: false, tournamentId, reason: 'outside-window' };
    }

    // If we get here, we need to send a notification
    console.log(`[${tournamentId}] In notification window. Sending email.`);
    
    // Mark this tournament as processed in memory to prevent duplicate emails
    if (!global.processedTournaments) {
      global.processedTournaments = [];
    }
    global.processedTournaments.push(tournamentId);

    // Get host email
    const hostDoc = await getDoc(doc(db, 'users', tournament.host_id));
    const hostEmail = hostDoc.data()?.email;

    if (!hostEmail) {
      console.error(`[${tournamentId}] Host user ${tournament.host_id} email not found.`);
      return { success: false, emailSent: false, tournamentId, error: 'Host email not found' };
    }
    
    // Format time in IST for email
    const formattedTime = startDate.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    // Also get the date in IST
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    const mailOptions = {
      from: `"Freefire Tournaments" <${emailUser}>`,
      to: hostEmail,
      subject: `🏆 Reminder: Your Tournament "${tournament.name}" Starts Soon!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
          </div>
          
          <p>Hello Tournament Host,</p>
          
          <p>Your tournament <strong>${tournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>, at ${formattedTime} IST!</p>
          
          <p>Don't forget to create the room a few minutes before the start time and share the room ID and password with participants.</p>
          
          <p>Good luck and have fun!</p>
        </div>
      `
    };

    console.log(`[${tournamentId}] Sending email to ${hostEmail}...`);
    await sendEmail(mailOptions);
    console.log(`[${tournamentId}] Email sent successfully!`);
    return { success: true, emailSent: true, tournamentId };

  } catch (error) {
    console.error(`[${tournamentId}] Failed to process:`, error);
    return { success: false, emailSent: false, tournamentId, error: error.message };
  }
}

async function checkAllTournaments() {
  const results = { success: true, notifications: 0, errors: [], checked: 0, message: '' };
  
  try {
    console.log('Querying for active tournaments...');
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
      // We'll check notificationSent in the code instead of in the query
    );
    
    const tournamentDocs = await getDocs(tournamentsQuery);
    results.checked = tournamentDocs.size;

    if (results.checked === 0) {
      results.message = 'No active tournaments found.';
      return results;
    }
    console.log(`Found ${results.checked} tournaments to process.`);

    const processingPromises = tournamentDocs.docs.map(processTournament);
    const settledResults = await Promise.allSettled(processingPromises);

    settledResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const res = result.value;
        if (res.success) {
          if (res.emailSent) results.notifications++;
        } else {
          results.errors.push(`[${res.tournamentId}] Error: ${res.error}`);
        }
      } else {
        results.errors.push(`A promise was unexpectedly rejected: ${result.reason}`);
      }
    });
    
    results.message = `Processed ${results.checked} tournaments. Sent ${results.notifications} notifications.`;
    if(results.errors.length > 0) {
        console.error('Errors during processing:', results.errors);
    }
  } catch (error) {
    console.error('Fatal error in checkAllTournaments:', error);
    results.success = false;
    results.errors.push(`Fatal error: ${error.message}`);
  }
  
  return results;
}

export default async function handler(req, res) {
  try {
    const { all, test_email } = req.query;
    
    if (test_email === 'true') {
      const result = await sendTestEmail();
      return res.status(result.success ? 200 : 500).json(result);
    }
    
    if (all === 'true') {
      const results = await checkAllTournaments();
      return res.status(results.success ? 200 : 500).json(results);
    }
    
    res.status(400).json({ error: 'Endpoint requires ?all=true or ?test_email=true' });

  } catch (error) {
    console.error('Unhandled fatal error in handler:', error);
    res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
  }
} 