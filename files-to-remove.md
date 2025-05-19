# Files to Remove or Modify for Credit-Based System Implementation

## Files to Remove

1. `netlify/functions/withdraw-funds.js` - Replace with new credit-based withdrawal function

## Files to Modify

1. `src/lib/cashfree-service.ts` - Modify to handle credit purchases instead of direct tournament payments
2. `src/components/payment/CashfreeCheckout.tsx` - Update to support credit packages
3. `src/components/tournament/EntryAndPrizesForm.tsx` - Change to use credits instead of money
4. `src/pages/TournamentCreate.tsx` - Add host credit validation
5. `src/lib/tournamentService.ts` - Update Tournament interface and methods
6. `src/pages/Tournaments.tsx` - Update to display credit costs instead of money
7. `src/components/tournament-details/PrizesTab.tsx` - Modify to show credit-based prizes
8. `netlify/functions/cashfree-webhook.js` - Update to handle credit purchases

## Confirmation on Cashfree Integration

Yes, Cashfree's payment gateway without the payouts feature is sufficient for this implementation since:

1. You'll only need to accept payments for:
   - Host subscriptions (₹49/month)
   - Credit packages (₹30, ₹95, ₹275)

2. Withdrawals will be processed manually via email notifications, so the payout API is not required.

3. The existing Cashfree integration can be modified to handle these specific payment types instead of direct tournament payments.