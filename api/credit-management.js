import { db } from './firebase-admin-helper.js';

/**
 * Helper to create a credit transaction record in Firestore.
 * This is used for logging all credit changes for audit purposes.
 */
const createCreditTransaction = (txData) => {
  const transactionData = {
    ...txData,
    createdAt: new Date(),
  };
  return db.collection("creditTransactions").add(transactionData);
};

/**
 * Penalizes a host by deducting credits and logging the transaction.
 * Runs within a Firestore transaction to ensure atomicity.
 * @param {string} hostId - The Firebase UID of the host.
 * @param {object} tournament - The tournament object.
 */
export const penalizeHost = (hostId, tournament) => {
  const penaltyAmount = 10;
  const userRef = db.collection("users").doc(hostId);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      console.error(`[Credit Mgmt] Host user ${hostId} not found for penalty.`);
      throw new Error(`Host user ${hostId} not found`);
    }

    const wallet = userDoc.data().wallet || {};
    const currentCredits = wallet.hostCredits || 0;
    const newCredits = currentCredits - penaltyAmount;

    transaction.update(userRef, { "wallet.hostCredits": newCredits });

    await createCreditTransaction({
      userId: hostId,
      type: "host_penalty",
      amount: -penaltyAmount,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: "hostCredits",
      description: `Penalty for not starting tournament: ${tournament.name}`,
      transactionDetails: {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
      },
    });
  });
};

/**
 * Refunds the entry fee to a single participant.
 * Runs within a Firestore transaction to ensure atomicity.
 * @param {object} participant - The participant object, containing authUid.
 * @param {object} tournament - The tournament object.
 */
export const refundEntryFee = (participant, tournament) => {
  const { authUid } = participant;
  if (!authUid) {
    console.warn(`[Credit Mgmt] Participant object is missing authUid, cannot refund.`, { participant });
    return Promise.resolve();
  }

  const entryFee = tournament.entry_fee || 0;
  if (entryFee <= 0) {
    return Promise.resolve();
  }

  const userRef = db.collection("users").doc(authUid);
  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      console.error(`[Credit Mgmt] Participant user ${authUid} not found for refund.`);
      throw new Error(`Participant user ${authUid} not found`);
    }

    const wallet = userDoc.data().wallet || {};
    const currentCredits = wallet.tournamentCredits || 0;
    const newCredits = currentCredits + entryFee;

    transaction.update(userRef, { "wallet.tournamentCredits": newCredits });

    await createCreditTransaction({
      userId: authUid,
      type: "tournament_refund",
      amount: entryFee,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: "tournamentCredits",
      description: `Refund for cancelled tournament: ${tournament.name}`,
      transactionDetails: {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
      },
    });
  });
}; 