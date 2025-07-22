# Squad Tournament Test Script

This comprehensive test script validates the Phase 1 squad tournament functionality using Firebase Admin SDK.

## What the Script Does

1. **Creates 8 Test Users**: Generates realistic Free Fire players with IGNs and UIDs
2. **Uses Existing Host**: Fetches the real host profile for `nishantgrewal2005@gmail.com` from the database
3. **Creates Squad Tournament**: Creates a tournament with zero entry fee as requested
4. **Forms 2 Teams**: Creates 2 squads with 4 players each (2 team leaders + 6 members)
5. **Tests Team Joining**: Validates the complete "Join as Team" flow
6. **Starts Tournament**: Simulates host starting the tournament with room details
7. **Completes Tournament**: Sets tournament status to completed with results
8. **Distributes Prizes**: Tests prize distribution to team leaders (50 credits to 1st, 30 to 2nd)
9. **Verifies Everything**: Confirms all squad functionality and prize distribution works perfectly

## Prerequisites

- Firebase Admin SDK service account key file
- Node.js environment with required dependencies
- Access to the Firebase project

## Running the Test

```bash
# Run the comprehensive squad tournament test
node test-squad-tournaments.js

# Clean up test data after testing (optional)
node test-squad-tournaments.js --cleanup
```

## Test Configuration

- **Host Email**: `nishantgrewal2005@gmail.com` (uses existing profile)
- **Tournament Mode**: Squad
- **Entry Fee**: 0 (free tournament)
- **Max Players**: 16 (4 teams × 4 players)
- **Teams Created**: 2 teams with 4 players each
- **Total Test Users**: 8 players

## Expected Results

After running the script successfully:

1. **Tournament Created**: A new squad tournament will be created
2. **Teams Formed**: 2 teams will join the tournament
3. **Tournament Started**: Tournament status changes to "ongoing" with room details
4. **Tournament Completed**: Tournament status changes to "completed" with results
5. **Prizes Distributed**: Team leaders receive prize credits (50 for 1st, 30 for 2nd)
6. **Data Validation**: All team data and prize distribution properly stored
7. **Test Results**: A comprehensive JSON file with test results will be generated

## Manual Testing Steps

After the script completes:

1. Login to the application with `nishantgrewal2005@gmail.com`
2. Navigate to "My Tournaments" or hosted tournaments
3. Find the "Squad Championship Test" tournament
4. Verify teams are displayed correctly in participants list
5. Test tournament start functionality
6. Test prize distribution to team leaders
7. Verify all squad-specific UI components

## Test Data Structure

The script creates teams with this structure:
```json
{
  "teamId": "test_team_timestamp_leaderUID",
  "teamName": "Test Squad 1",
  "teamTag": "TS1",
  "leaderId": "firebase_auth_uid",
  "leaderIgn": "LEADER_IGN",
  "leaderUid": "123456789012",
  "members": [
    {
      "ign": "MEMBER_IGN",
      "uid": "987654321098",
      "role": "member"
    }
  ],
  "totalMembers": 4,
  "joinedAt": "2025-01-22T13:51:35.000Z"
}
```

## Features Tested

- ✅ Squad tournament creation
- ✅ Team leader profile validation
- ✅ Team member data validation
- ✅ Team size validation (2-4 players for squad)
- ✅ Tournament joining with zero entry fee
- ✅ Team data storage in Phase 1 format
- ✅ Tournament participant tracking
- ✅ Tournament start functionality
- ✅ Tournament completion with results
- ✅ Prize distribution to team leaders
- ✅ Prize pool management and deduction
- ✅ User wallet balance updates
- ✅ Complete tournament lifecycle testing

## Cleanup

The script includes a cleanup function to remove test data:
- Deletes the test tournament
- Removes all test users from Firebase Auth and Firestore
- Cleans up generated files

## Files Generated

- `squad-tournament-test-results.json`: Complete test results and data
- Console logs with detailed execution information

## Troubleshooting

1. **Service Account Error**: Ensure the Firebase service account key path is correct
2. **Host Not Found**: Verify `nishantgrewal2005@gmail.com` exists in the database
3. **Permission Errors**: Check Firebase Admin SDK permissions
4. **Profile Validation**: Ensure host has all required profile fields (IGN, UID, etc.)

## Phase 1 vs Phase 2

This test validates **Phase 1** functionality:
- Team leaders pay full entry fees
- Team leaders manage all team members manually
- Team data stored directly in tournament participants
- All winnings go to team leaders

Phase 2 (future) will add:
- Shared payment system
- Automated prize splitting
- Team invitation system
- Persistent team management