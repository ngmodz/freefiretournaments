import { db } from './firebase-admin-helper.js';

/**
 * Helper to create a credit transaction record in Firestore.
 */
const createCreditTransaction = (transaction, txData) => {
  const transactionData = { ...txData, createdAt: new Date() };
  const newDocRef = db.collection("creditTransactions").doc();
  transaction.set(newDocRef, transactionData);
};

/**
 * Penalizes a host within a given Firestore transaction.
 * @param {admin.firestore.Transaction} transaction - The Firestore transaction object.
 * @param {string} hostId - The Firebase UID of the host.
 * @param {object} tournament - The tournament object.
 */
export async function _penalizeHostInTransaction(transaction, hostId, tournament) {
  const penaltyAmount = 10;
  const userRef = db.collection("users").doc(hostId);
  const userDoc = await transaction.get(userRef);

  if (!userDoc.exists) {
    throw new Error(`Host user ${hostId} not found`);
  }

  const wallet = userDoc.data().wallet || {};
  // FIX: Use tournamentCredits instead of hostCredits for penalty
  // If tournament credits are less than 10, allow negative balance
  const currentTournamentCredits = wallet.tournamentCredits || 0;
  const newTournamentCredits = currentTournamentCredits - penaltyAmount;

  transaction.update(userRef, { "wallet.tournamentCredits": newTournamentCredits });

  createCreditTransaction(transaction, {
    userId: hostId,
    type: "host_penalty",
    amount: -penaltyAmount,
    balanceBefore: currentTournamentCredits,
    balanceAfter: newTournamentCredits,
    walletType: "tournamentCredits",
    description: `Penalty for not starting tournament: ${tournament.name}`,
    transactionDetails: {
      tournamentId: tournament.id,
      tournamentName: tournament.name,
    },
  });
}

/**
 * Refunds an entry fee within a given Firestore transaction.
 * @param {admin.firestore.Transaction} transaction - The Firestore transaction object.
 * @param {object} participant - The participant object, containing authUid.
 * @param {object} tournament - The tournament object.
 */
export async function _refundEntryFeeInTransaction(transaction, participant, tournament) {
  const { authUid } = participant;
  if (!authUid) return;

  const entryFee = tournament.entry_fee || 0;
  if (entryFee <= 0) return;

  const userRef = db.collection("users").doc(authUid);
  const userDoc = await transaction.get(userRef);

  if (!userDoc.exists) {
    throw new Error(`Participant user ${authUid} not found`);
  }

  const wallet = userDoc.data().wallet || {};
  const currentCredits = wallet.tournamentCredits || 0;
  const newCredits = currentCredits + entryFee;

  transaction.update(userRef, { "wallet.tournamentCredits": newCredits });

  createCreditTransaction(transaction, {
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
}

// The exported functions below are for standalone use and are now wrappers.
export const penalizeHost = (hostId, tournament) => {
  return db.runTransaction((transaction) => {
    return _penalizeHostInTransaction(transaction, hostId, tournament);
  });
};

export const refundEntryFee = (participant, tournament) => {
  return db.runTransaction((transaction) => {
    return _refundEntryFeeInTransaction(transaction, participant, tournament);
  });
}; 