# Tournament Economy Improvements Plan

This document outlines the plan to improve the tournament economy by addressing key issues with entry fees, prize pools, and prize distribution.

---

### Question 1: Where does the entry fee go when a user joins a tournament?

**Problem:** Currently, the entry fee is deducted from the user's wallet but is not stored anywhere collectively. It simply disappears from the user's balance, and there is no central "pot" for the tournament.

**Solution:**
1.  **Introduce a `currentPrizePool` Field:** We will add a new field, `currentPrizePool`, to the `tournaments` collection in Firestore. This field will be a number and will be initialized to `0` when a new tournament is created.
2.  **Atomically Update the Prize Pool:** When a user pays the entry fee to join a tournament, the fee amount will be atomically added to the `currentPrizePool` of that specific tournament document. This will happen within the same database transaction as deducting the credits from the user's wallet to ensure data integrity.

---

### Question 2: From where are the prize credits sent to winners?

**Problem:** Prizes are currently created out of thin air and sent to the winners. They are not drawn from a collected pool of entry fees. This means the prize amounts are based on what the host *hoped* to collect (from a full tournament), not what was actually collected.

**Solution:**
1.  **Prizes Paid from `currentPrizePool`:** When the host distributes prizes, the credits will be deducted directly from the tournament's `currentPrizePool`.
2.  **Enforce Prize Limits:** The total amount of prizes distributed to winners cannot exceed the `currentPrizePool`. This ensures we never pay out more credits than were collected from participants.

---

### Question 3: How should the prize pool be calculated if a tournament is not full?

**Problem:** If a tournament is set for 5 players with a 5-credit entry (potential 25-credit pool), but only 3 players join, what should the prize pool be? The current system doesn't enforce this, leading to confusion and potential exploitation.

**Solution:**
1.  **Dynamic Prize Pool:** The `currentPrizePool` solves this perfectly. In the scenario above, since only 3 players joined, the `currentPrizePool` would be exactly `15` credits (3 players * 5 credits).
2.  **Prize Calculation:** The prize distribution will be calculated based on the prize settings *applied to the final `currentPrizePool`*. (See Question 5 for how the prize settings themselves will be changed).

---

### Question 4: What happens to leftover credits after prizes are distributed?

**Problem:** If the prize distribution doesn't account for 100% of the collected fees, or if rounding leaves a remainder, it's unclear where the leftover credits go.

**Solution:**
1.  **Transfer Remainder to Host:** After all winner prizes have been paid out from the `currentPrizePool`, any remaining credits will be transferred to the host's earnings wallet (`wallet.earnings`).
2.  **Full Accountability:** This ensures that every credit collected in the prize pool is accounted for, either going to a winner or to the host.

---

### Question 5: How do we prevent players from feeling cheated if the advertised prize isn't met?

**Problem:** A host advertises a "20 credit" prize, but the tournament doesn't fill up, so the prize pool can't support it. The winner receives less than advertised and feels cheated, leading to conflicts and loss of trust.

**Solution: Transparency and Dynamic Prizes**

The core of the solution is to stop advertising a fixed, potentially misleading prize and instead be transparent about the dynamic nature of the prize pool. This requires both backend and frontend changes.

1.  **Change Prize Setup for Hosts (Backend/UI Change):**
    *   In the tournament creation form, hosts will no longer enter a fixed credit amount for prizes.
    *   Instead, they will define a **percentage** of the prize pool for each winning position (e.g., 1st: 50%, 2nd: 30%, 3rd: 20%).
    *   The backend will store `prize_distribution` as percentages instead of fixed amounts.

2.  **Change Prize Display for Players (UI Change):**
    *   On the tournament details page, players will see a transparent breakdown of the prize structure:
        *   **Prize as Percentage:** "1st Place receives **50%** of the final prize pool."
        *   **Live Prize Pool:** A real-time counter: "**Current Prize Pool: 15 Credits**". This will update as more players join.
        *   **Estimated Prize:** A motivational, but clearly labeled, estimate: "**Win up to 20 credits!** (Estimated prize for 1st place with a full tournament)."

3.  **(Optional Feature) Minimum Participant Threshold:**
    *   To prevent "dead" tournaments, we can add a feature for hosts to set a minimum number of participants required.
    *   If the threshold is not met by the start time, the tournament is automatically canceled, and all entry fees are refunded.

---

### Summary of the New, Fair System

By implementing these changes, we will create a closed-loop economy for each tournament that is fair, transparent, and trustworthy.

1.  **Create Tournament:** Host sets prize distribution by **percentage**. `currentPrizePool` is set to `0`.
2.  **User Joins:** User sees the percentage-based prize and the live prize pool. Their entry fee is added to the `currentPrizePool`.
3.  **Tournament Ends:**
    *   Final prize amounts are calculated by applying the host's percentages to the final `currentPrizePool`.
    *   Winners are paid from the `currentPrizePool`.
    *   Any leftover credits are paid to the host.
    *   The `currentPrizePool` will be `0` after all distributions are complete.

This system aligns the expectations of both the host and the players and prevents disputes.

---

### Question 6: How do we prevent the platform from being flooded with low-quality tournaments?

**Problem:** If any user can create a tournament, the platform could become cluttered with too many tournaments, many of which may be low-quality or have no participants. This degrades the user experience and can cause conflicts.

**Solution: A "Verified Host" System**

We will restrict the ability to create tournaments to a select group of trusted users who have been approved by an admin.

1.  **Database Schema Change:**
    *   Add a new boolean field named `isVerifiedHost` to the `users` collection in Firestore.
    *   This field will default to `false` for all users.

2.  **Admin's Role in Approving Hosts:**
    *   The application owner (you) will be responsible for approving hosts.
    *   This can be done by manually accessing the Firestore database and changing a user's `isVerifiedHost` field from `false` to `true`.

3.  **Backend Logic for Restriction:**
    *   In the `createTournament` function (`src/lib/tournamentService.ts`), we will add a check at the very beginning.
    *   The function will fetch the profile of the user attempting to create the tournament. If their `isVerifiedHost` field is not `true`, the function will be stopped, and an error will be returned.

4.  **Enforcing with Security Rules:**
    *   To ensure the system is secure, we will update the Firestore security rules for the `tournaments` collection.
    *   The `allow create` rule will be modified to only permit users to create a tournament if their own user document contains `isVerifiedHost: true`. This prevents any unauthorized user from creating a tournament, even if they bypass the application's UI.

---

### Question 7: How should the "Verified Host" status affect the UI and how do users become hosts?

**Problem:** If we restrict hosting to verified users, we need a clear process for users to become hosts and the UI should adapt based on their status. We don't want to show "Buy Host Credits" to a user who can't host.

**Solution: An Application Process and Conditional UI**

1.  **Conditional UI for Host Features:**
    *   **Frontend Logic:** The application's UI will be updated to check for the `isVerifiedHost` status on the user's profile.
    *   **Hidden Elements:** UI elements related to hosting, such as the "Buy Host Credits" option in the wallet or a "Create Tournament" button, will only be visible to users where `isVerifiedHost` is `true`. For all other users, these elements will be hidden.

2.  **Host Application Form:**
    *   **New Page/Form:** We will create a new "Apply to be a Host" page in the application.
    *   **Data Collection:** This form will allow users to submit their details and reasons for wanting to become a host.
    *   **Application Submission:** Submitting the form will create a new document in a `hostApplications` collection in Firestore. Each document will contain the applicant's details and a `status` field, initially set to `pending`.

3.  **Admin Review Workflow:**
    *   **Manual Review:** The application owner (you) can review these "pending" applications directly in the Firebase console.
    *   **Approval:** To approve a user, you will manually update their document in the `users` collection to set `isVerifiedHost: true`. Upon their next session, they will see all the host-related UI and be able to create tournaments. 