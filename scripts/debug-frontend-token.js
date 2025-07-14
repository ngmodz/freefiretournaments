// Debug utility to check current user's token claims in browser console
// Run this in the browser console on localhost:8084

console.log('🔍 Checking current user token claims...');

// Get current Firebase user
const user = firebase.auth().currentUser;
if (!user) {
  console.error('❌ No user signed in');
} else {
  console.log('✅ User signed in:', user.email);
  
  // Get fresh token with claims
  user.getIdTokenResult(true).then(idTokenResult => {
    console.log('🎫 Token Claims:', idTokenResult.claims);
    console.log('🔑 Admin claim:', idTokenResult.claims.admin || false);
    console.log('🏆 Host claim:', idTokenResult.claims.host || false);
    console.log('⏰ Token issued at:', new Date(idTokenResult.issuedAtTime));
    console.log('⏰ Token expires at:', new Date(idTokenResult.expirationTime));
    
    if (!idTokenResult.claims.admin) {
      console.error('❌ PROBLEM FOUND: Token lacks admin claims!');
      console.log('💡 SOLUTION: User needs to sign out and sign back in');
    } else {
      console.log('✅ Token has admin claims');
    }
  }).catch(error => {
    console.error('❌ Error getting token:', error);
  });
}
