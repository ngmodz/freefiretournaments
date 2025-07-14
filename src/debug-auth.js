// Debug current user authentication
import { auth } from './firebase-config.js';

// Function to check current user
export const debugCurrentUser = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('❌ No user logged in');
      return null;
    }
    
    console.log('✅ Current user:', user.uid);
    console.log('📧 Email:', user.email);
    
    // Get fresh token to check claims
    const idTokenResult = await user.getIdTokenResult(true);
    console.log('🎫 Token claims:', idTokenResult.claims);
    console.log('🔑 Admin claim:', idTokenResult.claims.admin);
    console.log('👤 Expected admin UID:', 'EaiefFlrNzMgpPEBUjyJvZ4Ydlx1');
    console.log('✅ UID matches admin:', user.uid === 'EaiefFlrNzMgpPEBUjyJvZ4Ydlx1');
    
    return {
      uid: user.uid,
      email: user.email,
      claims: idTokenResult.claims,
      isExpectedAdmin: user.uid === 'EaiefFlrNzMgpPEBUjyJvZ4Ydlx1'
    };
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    return null;
  }
};

// Add to window for browser console access
window.debugCurrentUser = debugCurrentUser;

console.log('🚀 Debug function added to window. Run: await debugCurrentUser()');
