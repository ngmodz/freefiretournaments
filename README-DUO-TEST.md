# Duo Tournament Test Script

## Overview

The `test-duo-tournaments.js` script provides comprehensive automated testing for duo tournament functionality in the Free Fire tournament application. It tests the complete lifecycle of duo tournaments from creation to prize distribution.

## Features Tested

### 🎯 Core Duo Functionality
- **Duo Team Creation**: Tests creation of teams with exactly 2 players
- **Duo Validation**: Validates duo-specific constraints and rules
- **Tournament Joining**: Tests duo teams joining tournaments
- **Prize Distribution**: Verifies prizes are distributed to team leaders
- **Data Integrity**: Ensures all duo-specific data is handled correctly

### 🔍 Validation Testing
- **Team Size Validation**: Ensures exactly 2 players per duo team
- **Input Validation**: Tests team name, tag, and member data validation
- **Error Handling**: Verifies proper error messages for invalid data
- **Constraint Enforcement**: Tests duo-specific business rules

### 💰 Financial Testing
- **Entry Fee Deduction**: Verifies leader pays full entry fee
- **Prize Distribution**: Tests prize allocation to team leaders only
- **Wallet Management**: Validates credit and balance updates
- **Transaction Integrity**: Ensures financial operations are atomic

## Test Configuration

```javascript
const TEST_CONFIG = {
  hostEmail: 'nishantgrewal2005@gmail.com',
  tournamentName: 'Test Duo Tournament - [timestamp]',
  entryFee: 50,
  prizePool: 200,
  maxPlayers: 8, // 4 duo teams
  duoTeams: [
    // 4 realistic duo teams with leaders and partners
  ]
};
```

## Test Scenarios

### 1. User Creation (4 Duo Team Leaders)
- Creates realistic Free Fire player profiles
- Initializes wallets with sufficient credits
- Sets up authentication and user data

### 2. Tournament Creation
- Creates duo-mode tournament
- Sets appropriate constraints (max 8 players = 4 duo teams)
- Configures prize distribution (60% first, 40% second)

### 3. Duo Team Formation
- Tests `validateDuoTeam()` function
- Creates teams with exactly 1 partner + leader
- Validates team data integrity

### 4. Tournament Joining
- Tests `joinTournamentAsTeam()` for duo teams
- Verifies entry fee deduction from leaders
- Confirms team data storage in tournament

### 5. Tournament Execution
- Simulates tournament start and completion
- Updates tournament status appropriately
- Prepares for prize distribution

### 6. Prize Distribution
- Distributes prizes to top 2 duo teams
- Verifies prizes go to team leaders only
- Validates wallet balance updates

### 7. Data Cleanup
- Removes all test users and data
- Cleans up tournaments and teams
- Ensures no test data remains

## Usage

### Prerequisites
- Firebase Admin SDK configured
- Service account key file (`serviceAccountKey.json`)
- Node.js environment with required dependencies

### Running the Test

```bash
# Run duo tournament tests
node test-duo-tournaments.js
```

### Expected Output

```
🎯 Starting Comprehensive Duo Tournament Tests
============================================================

🔧 Creating test users...
✅ Created user: ThunderKing (leader1@test.com)
✅ Created user: LightningBolt (leader2@test.com)
✅ Created user: StormMaster (leader3@test.com)
✅ Created user: BlazeCommander (leader4@test.com)
✅ Successfully created 4 test users

🏆 Creating duo tournament...
✅ Created duo tournament: Test Duo Tournament - [timestamp]
   Tournament ID: [tournament-id]
   Mode: Duo (exactly 2 players per team)
   Entry Fee: 50 credits
   Prize Pool: 200 credits
   Max Players: 8 (4 duo teams)

🔍 Testing duo team validation...
✅ Valid duo team validation: PASSED
✅ Invalid duo team validation: PASSED
   Error message: Duo teams require exactly one additional member (you + 1 teammate)
✅ Empty name validation: PASSED

👥 Creating duo teams and joining tournament...

📝 Creating duo team: Thunder Duo
✅ Duo validation passed for team: Thunder Duo
✅ Duo team "Thunder Duo" joined tournament successfully
   Leader: ThunderKing (123456789)
   Partner: ThunderQueen (987654321)
   Team Tag: [THD]

[... similar output for other teams ...]

✅ Successfully created and joined 4 duo teams

🔍 Verifying tournament participants...
📊 Tournament Status: upcoming
👥 Total Participants: 4
   1. Team: Thunder Duo [THD]
      Leader: ThunderKing (123456789)
      Members: 2 players
✅ Duo constraint verified for team Thunder Duo
[... similar output for other teams ...]
📈 Total Players Across All Teams: 8
✅ All duo teams joined successfully

🚀 Starting and completing tournament...
✅ Tournament started (status: active)
✅ Tournament completed (status: completed)

💰 Testing prize distribution to duo leaders...

🏆 Distributing prize for position 1:
   Team: Thunder Duo [THD]
   Leader: ThunderKing
   Prize: 120 credits
✅ Prize distributed successfully to ThunderKing
   Balance: 0 → 120 credits

🏆 Distributing prize for position 2:
   Team: Lightning Duo [LTD]
   Leader: LightningBolt
   Prize: 80 credits
✅ Prize distributed successfully to LightningBolt
   Balance: 0 → 80 credits

✅ Prize distribution testing completed

🧹 Cleaning up test data...
✅ Deleted user: [user-id-1]
✅ Deleted user: [user-id-2]
✅ Deleted user: [user-id-3]
✅ Deleted user: [user-id-4]
✅ Deleted tournament: [tournament-id]
✅ Cleanup completed successfully

============================================================
🎉 ALL DUO TOURNAMENT TESTS PASSED SUCCESSFULLY!
⏱️  Total execution time: 15.42 seconds
============================================================
```

## Test Data Structure

### Duo Team Configuration
```javascript
{
  name: 'Thunder Duo',
  tag: 'THD',
  leader: {
    email: 'leader1@test.com',
    ign: 'ThunderKing',
    uid: '123456789'
  },
  partner: {
    ign: 'ThunderQueen',
    uid: '987654321'
  }
}
```

### Tournament Structure
```javascript
{
  name: 'Test Duo Tournament',
  mode: 'Duo',
  entry_fee: 50,
  prize_pool: 200,
  max_players: 8, // 4 duo teams
  prizeDistribution: {
    1: 120, // 60% for 1st place
    2: 80   // 40% for 2nd place
  }
}
```

## Key Validations

### Duo Team Constraints
- ✅ Exactly 2 players per team (leader + 1 partner)
- ✅ Team leader must be registered user
- ✅ Partner requires valid IGN and UID
- ✅ Team name and tag validation
- ✅ No duplicate UIDs or IGNs

### Financial Validations
- ✅ Leader pays full entry fee
- ✅ Sufficient credit balance checking
- ✅ Prize distribution to leaders only
- ✅ Wallet balance accuracy

### Tournament Validations
- ✅ Duo mode tournament creation
- ✅ Correct participant counting (teams vs players)
- ✅ Status transitions (upcoming → active → completed)
- ✅ Prize pool distribution rules

## Error Scenarios Tested

1. **Invalid Team Size**: Teams with 0, 3, or 4+ members
2. **Missing Data**: Empty team names, tags, or member info
3. **Invalid UIDs**: Non-numeric or wrong-length UIDs
4. **Duplicate Data**: Same UID/IGN used multiple times
5. **Insufficient Credits**: Leaders without enough credits

## Integration Points

The test script validates integration with:
- **Team Service**: `validateDuoTeam()`, `createDuoTeamForTournament()`
- **Tournament Service**: `joinTournamentAsTeam()`
- **Prize Service**: `distributePrize()`
- **Firebase Auth**: User creation and management
- **Firestore**: Data persistence and retrieval
- **Wallet System**: Credit management and transactions

## Maintenance

### Adding New Test Cases
1. Add new scenarios to `TEST_CONFIG.duoTeams`
2. Implement additional validation functions
3. Update cleanup procedures for new data

### Modifying Test Data
1. Update `TEST_CONFIG` object
2. Ensure cleanup procedures handle new data types
3. Verify all test assertions remain valid

## Troubleshooting

### Common Issues
1. **Firebase Connection**: Ensure service account key is valid
2. **Permission Errors**: Verify Firebase Admin SDK permissions
3. **Cleanup Failures**: Check for orphaned test data
4. **Timing Issues**: Adjust delays for async operations

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=true node test-duo-tournaments.js
```

## Related Files
- `test-squad-tournaments.js` - Squad tournament testing
- `src/lib/teamService.ts` - Team management functions
- `src/lib/tournamentService.ts` - Tournament operations
- `src/lib/prizeDistributionService.ts` - Prize distribution logic