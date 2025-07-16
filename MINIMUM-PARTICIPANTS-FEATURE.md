# Minimum Participants Feature Documentation

## Overview

The minimum participants feature ensures that tournaments only proceed if they have enough players to be competitive and worthwhile. If a tournament doesn't meet the minimum participant requirement by its start time, it will be automatically cancelled and all participants will be refunded.

## How It Works

### 1. Tournament Creation
- Hosts can now set a **minimum participants** field when creating tournaments
- This field is required and must be:
  - Greater than 0
  - Less than or equal to the maximum players
- Default value is set to 2 for new tournaments

### 2. Tournament Display
- The minimum participants requirement is displayed in:
  - Tournament header
  - Tournament sidebar (with warning if insufficient participants)
  - Tournament creation form

### 3. Tournament Start Validation
- When a host tries to manually start a tournament, the system checks:
  - Tournament has enough participants (current >= minimum required)
  - If not enough participants, the start is blocked with an error message

### 4. Automatic Cancellation System
- A scheduled check runs every 5-10 minutes
- Checks tournaments that have passed their start time but are still "active"
- If a tournament has insufficient participants:
  - Tournament status is changed to "cancelled"
  - All participants are automatically refunded their entry fees
  - Cancellation emails are sent to host and participants
  - Tournament is scheduled for deletion (TTL set to 15 minutes)

## API Endpoints

### `/api/tournament-management`
- **Method**: POST
- **Purpose**: Combined endpoint for tournament management operations
- **Actions**:
  - `cancel-tournament`: Cancel a tournament and refund participants
  - `check-minimum-participants`: Check and cancel tournaments with insufficient participants  
  - `check-notifications`: Send tournament start notifications (default action)
- **Request Body**: 
  ```json
  {
    "action": "check-minimum-participants"
  }
  ```
- **Response**: 
  ```json
  {
    "success": true,
    "message": "Checked X tournaments, cancelled Y due to insufficient participants",
    "checkedCount": 5,
    "cancelledCount": 2
  }
  ```

## Database Schema Changes

### Tournament Collection
New field added:
- `min_participants` (number): Minimum number of participants required to start the tournament
- `cancellation_reason` (string): Reason for cancellation (e.g., "insufficient_participants")

## Frontend Changes

### Tournament Creation Form
- Added "Min Participants" field in Step 1 (Basic Information)
- Validation ensures min_participants <= max_players
- Form layout updated to accommodate the new field (4-column grid)

### Tournament Display
- Tournament header shows minimum participants requirement
- Tournament sidebar shows minimum required with warning if insufficient
- Tournament start button is disabled if minimum not met

## Automation Setup

### Manual Check
```bash
# Check tournaments manually
curl -X POST https://freefiretournaments.vercel.app/api/tournament-management \
  -H "Content-Type: application/json" \
  -d '{"action": "check-minimum-participants"}'
```

### Automated Check (Recommended)
Set up a cron job or scheduled task to run every 5-10 minutes:

#### Linux/macOS (crontab)
```bash
# Run every 5 minutes
*/5 * * * * cd /path/to/project && node scripts/automated-min-participants-check.js
```

#### Windows (Task Scheduler)
Run the PowerShell script: `scripts/run-min-participants-check.ps1`

### External Cron Service
Use a service like cron-job.org to call the API endpoint every 5 minutes:
- URL: `https://freefiretournaments.vercel.app/api/tournament-management`
- Method: POST
- Body: `{"action": "check-minimum-participants"}`
- Headers: `Content-Type: application/json`
- Frequency: Every 5 minutes

## Testing

### Create Test Tournament
```bash
node scripts/create-min-participants-test.js
```

### Check Tournament Status
```bash
node scripts/check-tournament-status.js <tournament-id>
```

### Test Scenarios

1. **Tournament with sufficient participants**
   - Create tournament with min_participants: 3, max_players: 10
   - Add 4 participants
   - Tournament should start normally

2. **Tournament with insufficient participants**
   - Create tournament with min_participants: 5, max_players: 10
   - Add only 2 participants
   - Wait for start time to pass
   - Run check API
   - Tournament should be cancelled and participants refunded

## Error Handling

### Tournament Start Validation
- Error message: "Tournament needs at least X participants to start. Currently have Y."
- Start button is disabled with explanation

### Automatic Cancellation
- Tournaments are only cancelled if:
  - Start time has passed (within last 5 minutes to avoid old tournaments)
  - Status is still "active"
  - Participants < minimum required
- All participants receive full refunds
- Host and participants receive cancellation emails

## Notifications

### Cancellation Emails

#### Host Email
- Subject: "Tournament Cancelled: [Tournament Name]"
- Content: Details about insufficient participants, refund information
- Action: Encourages creating new tournament

#### Participant Email
- Subject: "Tournament Cancelled: [Tournament Name]"
- Content: Explanation of cancellation, refund confirmation
- Action: Directs to dashboard to check balance and join other tournaments

## Benefits

1. **Better User Experience**: No disappointment from tournaments with too few players
2. **Automatic Refunds**: No manual intervention needed for cancellations
3. **Host Flexibility**: Hosts can set appropriate minimums for their tournament style
4. **Resource Optimization**: Prevents low-participation tournaments from consuming system resources
5. **Fair Play**: Ensures competitive tournaments with adequate participation

## Configuration

### Default Values
- Default minimum participants: 2
- Cancellation check frequency: Every 5 minutes
- Check window: Tournaments that started within last 5 minutes
- Refund processing: Automatic and immediate
- Tournament cleanup: 15 minutes after cancellation
