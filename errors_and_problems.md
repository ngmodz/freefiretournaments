# App Errors and Problems

## Problem 1: Firebase Index Missing for Withdrawal Request & Mobile Scroll Issue

### Description
When attempting to withdraw funds from the wallet page by clicking the withdraw button, the application throws a FirebaseError indicating a missing index. Additionally, on mobile devices, the withdraw button is not visible due to a lack of scrollability, preventing users from completing the withdrawal process.

### Error Message
```
index-BIomYV--.js:4280  Error requesting withdrawal: FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/freefire-tournaments-ba2a6/firestore/indexes?create_composite=CmVwcm9qZWN0cy9mcmVlZmlyZS10b3VybmFtZW50cy1iYTJhNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvd2l0aGRyYXdhbFJlcXVlc3RzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg8KC3JlcXVlc3RlZEF0EAIaDAoIX19uYW1lX18QAg
```

### Impact
Users are unable to withdraw funds due to a backend database configuration issue (missing index) and a frontend UI/UX problem on mobile devices (lack of scroll to reach the button).

### Suggested Action
1. Create the specified composite index in Firebase Console.
2. Investigate and fix the mobile scrolling issue on the wallet/withdrawal page to ensure the withdraw button is accessible. 

## Problem 2: Tournament Creation Failure - Undefined initialPrizePool

### Description
When attempting to create (publish) a tournament, the application throws a FirebaseError. The error message indicates that the `addDoc()` function is being called with invalid data because the `initialPrizePool` field is `undefined` within the `tournaments` document. This prevents the successful creation of new tournaments.

### Error Message
```
Error creating tournament: FirebaseError: Function addDoc() called with invalid data. Unsupported field value: undefined (found in field initialPrizePool in document tournaments/uq1nXWD8GKOBeOjCBhDe)
```

### Impact
Users are unable to create new tournaments, halting a core functionality of the application.

### Suggested Action
1. Identify where the `initialPrizePool` value is supposed to be set before the `addDoc()` call for tournament creation.
2. Debug why `initialPrizePool` is `undefined`. This could be due to:
    - A form field not being properly captured.
    - Incorrect calculation or assignment of the prize pool.
    - A missing default value.
3. Ensure that `initialPrizePool` is always a defined value (e.g., a number, even if 0) before the tournament document is sent to Firestore. 

## Problem 3: Credit Purchase Failure - 405 Method Not Allowed

### Description
When attempting to purchase credits, the application fails to create a CashFree order. The console logs indicate a `405 Method Not Allowed` error when making a `POST` request to the `/api/create-payment-order` endpoint. This prevents users from successfully purchasing credits.

### Error Message
```
POST https://freefiretournaments.vercel.app/api/create-payment-order 405 (Method Not Allowed)
? API Response Error: {status: 405, statusText: '', body: ''}
? Error creating payment order: Error: API Error: 405
CashFree checkout error: Error: API Error: 405
Error initiating payment: Error: API Error: 405
```

### Impact
Users are unable to purchase credits, which is a critical revenue and functionality path for the application.

### Suggested Action
1. Verify the `create-payment-order.js` file (or equivalent) in the `api/` directory. Ensure it correctly handles `POST` requests.
2. Check the server-side routing configuration (e.g., Vercel `vercel.json` or equivalent) to ensure the `/api/create-payment-order` endpoint is properly exposed and configured to accept `POST` requests.
3. Ensure there are no middleware or security configurations blocking `POST` requests to this endpoint.
4. Examine the `cashfreeService.ts` or related client-side code to confirm the correct HTTP method (POST) is being used when calling the API. 

## Problem 4: Contact Support Form Submission Failure - 405 Method Not Allowed & JSON Error

### Description
When attempting to submit the contact support form, the application encounters two issues: a `405 Method Not Allowed` error for a `POST` request to the `/api/contact` endpoint, and a `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`. This prevents users from sending support messages.

### Error Message
```
POST https://freefiretournaments.vercel.app/api/contact 405 (Method Not Allowed)
Failed to send message: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input
```

### Impact
Users are unable to contact support through the in-app form, potentially leading to a poor user experience and unaddressed issues.

### Suggested Action
1. Verify the `/api/contact` endpoint (e.g., `api/email-service.js` or similar) is correctly configured to accept `POST` requests.
2. Check the server-side routing (e.g., Vercel `vercel.json`) to ensure the `/api/contact` route is properly defined and allows `POST` methods.
3. Investigate the `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`. This suggests the server might be returning an empty or malformed response that the client is trying to parse as JSON. Even with a 405 error, the server should return a valid (even if error) JSON response, or no body if appropriate.
4. Ensure the server-side logic for the contact form endpoint always returns a valid JSON response, even in error cases, or handles cases where no JSON body is expected gracefully on the client. 

## Problem 5: Gender Field Not Changeable in Edit Profile

### Description
In the Edit Profile section of the application, users are unable to change their gender. The gender input field appears to be unclickable or otherwise unresponsive, preventing users from updating this personal information.

### Impact
Users cannot update their gender in their profile, leading to incomplete or inaccurate user data and a frustrating user experience.

### Suggested Action
1. Locate the `ProfileEditForm.tsx` or related components responsible for rendering the Edit Profile section.
2. Inspect the implementation of the gender input field. Check for:
    - Correct component usage (e.g., `select`, `radio-group`, `input` with `datalist`).
    - Event handlers (e.g., `onChange`) that might be missing or incorrectly implemented.
    - CSS properties (e.g., `pointer-events: none;`, `z-index`) that might be inadvertently blocking interaction.
    - State management issues that prevent the UI from updating or the value from being saved.
3. Ensure the form field is properly connected to the state and allows user interaction. 