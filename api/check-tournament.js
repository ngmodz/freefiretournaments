import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, Timestamp, runTransaction } from 'firebase/firestore';
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

async function processTournament(tournamentDoc) {
  const tournamentId = tournamentDoc.id;
  let emailData = null;

  try {
    await runTransaction(db, async (transaction) => {
      console.log(`[${tournamentId}] Starting transaction...`);
      const freshTournamentDoc = await transaction.get(tournamentDoc.ref);
      if (!freshTournamentDoc.exists()) {
        console.error(`[${tournamentId}] Document not found during transaction.`);
        throw new Error(`[${tournamentId}] Document not found during transaction.`);
      }

      const tournament = freshTournamentDoc.data();
      console.log(`[${tournamentId}] Status: ${tournament.status}, NotificationSent: ${tournament.notificationSent}`);

      if (tournament.status !== 'active') {
        console.log(`[${tournamentId}] Skipping: Status is not 'active'.`);
        return;
      }
       if (tournament.notificationSent) {
        console.log(`[${tournamentId}] Skipping: Notification already sent.`);
        return; 
      }

      const now = new Date();
      const startDate = tournament.start_date.toDate();
      const minutesToStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
      console.log(`[${tournamentId}] Time check: Starts in ${minutesToStart.toFixed(1)} minutes.`);

      // Wider notification window for cron job robustness
      if (minutesToStart >= 15 && minutesToStart <= 25) {
        console.log(`[${tournamentId}] SUCCESS: In notification window. Marking as sent in transaction.`);
        transaction.update(tournamentDoc.ref, { 
          notificationSent: true,
          notificationSentAt: Timestamp.now()
        });

        emailData = { // Prepare data for sending email *after* successful transaction
          host_id: tournament.host_id,
          tournamentName: tournament.name,
          startDate,
        };
      } else {
        console.log(`[${tournamentId}] Skipping: Not in notification window (15-25 mins).`);
      }
    });

    if (emailData) {
      console.log(`[${tournamentId}] Transaction successful. Preparing to send email.`);
      const hostDoc = await getDoc(doc(db, 'users', emailData.host_id));
      const hostEmail = hostDoc.data()?.email;

      if (!hostEmail) {
        console.error(`[${tournamentId}] ERROR: Host user ${emailData.host_id} email not found.`);
        throw new Error(`Host user ${emailData.host_id} email not found.`);
      }
      console.log(`[${tournamentId}] Found host email. Preparing mail options.`);
      
      const formattedTime = emailData.startDate.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    const mailOptions = {
      from: `"Freefire Tournaments" <${emailUser}>`,
      to: hostEmail,
        subject: `🏆 Reminder: Your Tournament "${emailData.tournamentName}" Starts Soon!`,
        html: `<p>Your tournament, <strong>${emailData.tournamentName}</strong>, is scheduled to start in ~20 minutes, at ${formattedTime}.</p>`
      };

      console.log(`[${tournamentId}] Sending email to ${hostEmail}...`);
      await sendEmail(mailOptions);
      return { success: true, emailSent: true, tournamentId };
    }
    // Not in the window or already sent, which is a success case (no action needed).
    console.log(`[${tournamentId}] No action needed (not in window or already processed).`);
    return { success: true, emailSent: false, tournamentId };

  } catch (error) {
    console.error(`[${tournamentId}] Failed to process:`, error);
    return { success: false, emailSent: false, tournamentId, error: error.message };
  }
}

async function checkAllTournaments() {
  const results = { success: true, notifications: 0, errors: [], checked: 0, message: '' };
  
  try {
    console.log('--- checkAllTournaments Job Started ---');
    console.log('Querying for active tournaments...');
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
      // REMOVED: where('notificationSent', '!=', true) to avoid composite index issues.
      // The check will be performed in the function logic.
    );
    
    const tournamentDocs = await getDocs(tournamentsQuery);
    results.checked = tournamentDocs.size;
    console.log(`Query found ${results.checked} active tournaments.`);

    if (results.checked === 0) {
      results.message = 'No active tournaments found.';
      console.log(results.message);
      return results;
    }
    console.log(`Processing ${results.checked} tournaments...`);

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
        // A promise was rejected, which shouldn't happen with the current processTournament structure
        results.errors.push(`A promise was unexpectedly rejected: ${result.reason}`);
        console.error('A promise was unexpectedly rejected:', result.reason);
      }
    });
    
    results.message = `Job finished. Processed ${results.checked} tournaments. Sent ${results.notifications} notifications. Encountered ${results.errors.length} errors.`;
    console.log(results.message);
    if(results.errors.length > 0) {
      console.error('Errors encountered:', results.errors);
    }
    console.log('--- checkAllTournaments Job Ended ---');
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