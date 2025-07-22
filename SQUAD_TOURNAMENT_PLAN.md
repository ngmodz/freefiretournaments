# Squad Tournament Implementation Plan

This document outlines the plan for implementing squad-based tournaments, including the data model, user flows, and a detailed analysis of pros, cons, and proposed solutions for potential problems.

## Phase 1: Initial Implementation (MVP)

### 1. Data Model Updates

*   **New `teams` Collection:** A new top-level collection in Firestore called `teams`. Each document will represent a single team:
    *   `name`: Team's name (e.g., "The Annihilators").
    *   `tag`: Short team tag (e.g., "ANH").
    *   `leader_id`: User ID of the team's creator.
    *   `members`: Array of objects, each containing `user_id`, `ign` (in-game name), and `role` ("leader" or "member").
    *   `created_at`: Timestamp of team creation.

*   **Modified `tournaments` Collection:** The `participants` field will be updated to store an array of team IDs for squad-based tournaments, instead of individual user IDs.

### 2. Team Management (`src/lib/teamService.ts`)

A new file `src/lib/teamService.ts` will be created to handle all team-related operations:
*   **Creating a Team:** Allow a user to create a new team and automatically become its leader.
*   **Inviting Members:** (Initial implementation will handle this via manual input by leader during tournament join).
*   **Managing Members:** (Phase 1 will not include advanced member management beyond initial creation).
*   **Disbanding a Team:** (To be considered for later phases, or if a team leader cancels joining a tournament before start).

### 3. Tournament Flow (Squad-Based)

*   **Tournament Creation:** Host selects team size (e.g., 2 for Duo, 4 for Squad) during tournament creation.
*   **Joining Process:**
    *   A player, acting as the **Team Leader**, clicks "Join as Team."
    *   The leader pays the **full entry fee for the entire team** from their own credit wallet.
    *   After payment, the leader is prompted to enter the **In-Game Name (IGN) and User ID (UID)** for each of their teammates.
*   **Host's View:**
    *   The host has a special dashboard view displaying registered teams.
    *   For each team, the host sees the team name, all team members' names and UIDs, and an indicator of who the Team Leader is.
*   **Prize Distribution:**
    *   After the tournament, the host enters results.
    *   The host selects the winning **Team Leader(s)'** IGNs/UIDs from the participant list.
    *   The **entire prize amount is sent directly to the Team Leader's account**. The leader is then responsible for distributing winnings to teammates.

### 4. UI/UX Changes (Initial for Phase 1)

*   **Tournament Creation Form:** Update `TournamentCreate.tsx` to include an option for "mode" (Solo, Duo, Squad) and adjust `max_players`/`min_participants` logic based on this mode.
*   **Join Tournament Flow:** Implement a new flow for "Join as Team" that prompts for team member details and handles the single team payment.
*   **Host Dashboard:** Modify the host's tournament view to display teams and their members clearly.

### Analysis of Phase 1 Plan

#### ✅ Pros (Advantages)

1.  **Simplicity for the Host:** Streamlined workflow; hosts manage teams, not individual players. Single action for prize distribution per winning team.
2.  **Simplified Prize & Transaction Logic:** Sending the entire prize pool to one person (the leader) avoids complexity of splitting payments, rounding errors, and multiple transaction failures.
3.  **No Formal "Team System" Needed (Faster MVP):** Bypasses the need for a complex, persistent "Team" entity, allowing faster delivery. Teams are formed "on the fly" for each tournament.
4.  **Clear Financial Responsibility:** Leader paying for the whole team ensures upfront commitment and avoids payment issues from individual team members.

#### ⚠️ Potential Problems & Consequences

1.  **For the Team Leader:**
    *   **Financial Risk:** Leader fronts entire entry fee; no platform protection if teammates don't pay back.
    *   **Burden of Manual Entry:** Manual input of teammates' IGNs/UIDs is error-prone, potentially causing verification issues for the host.
    *   **"Banker" Burden & Dispute Risk:** Leader receives 100% of winnings and is solely responsible for distribution. Can lead to off-platform disputes that the platform cannot mediate.

2.  **For the Team Members (Non-Leaders):**
    *   **Total Trust Requirement:** Members must completely trust their leader for correct registration and prize distribution; no system guarantee.
    *   **Lack of Official Participation:** System does not formally recognize individual members as participants, potentially impacting personal tournament history or notifications.

3.  **For the Host & Platform:**
    *   **Data Integrity Issues:** Reliance on leader-provided data means typos can complicate host's in-game verification process, leading to disputes.
    *   **Support Ticket Magnet:** Inevitable support requests regarding payout disputes, which the platform cannot resolve due to off-platform distribution.

## Phase 2: Future Enhancements (Addressing Limitations)

### 1. For the Team Leader

*   **Addressing Financial Risk:** Implement a "Pay Your Share" system where each team member must accept an invite and pay their individual portion of the entry fee for the team to be officially entered.
*   **Addressing Manual Entry:** Develop a "Friends" or "Roster" system where users can add friends. When forming a team, the leader selects from their verified friends list, automatically populating accurate IGNs/UIDs.

### 2. For the Team Members

*   **Addressing Trust & Official Participation:**
    *   With a formal team system, members would receive official invites and status.
    *   Introduce automated prize splitting: Upon tournament conclusion, the system automatically splits the prize money evenly among winning team members' wallets, ensuring direct and guaranteed payout.

### 3. For the Host & Platform

*   **Addressing Data Integrity:** The "Friends/Roster" system would ensure all participant data (IGNs/UIDs) is system-verified, making host verification much smoother.
*   **Addressing Support Load:** Automated prize splitting would significantly reduce or eliminate support tickets related to payout disputes, as the platform handles the distribution directly.

--- 