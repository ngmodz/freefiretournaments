import 'dotenv/config';
import axios from 'axios';

async function testAPIDirectly() {
  console.log('--- Testing Current Deployed API ---');
  
  try {
    // Test the process-notifications API to see what version is deployed
    console.log('Testing process-notifications API...');
    const response = await axios.get('https://freefiretournaments.vercel.app/api/process-notifications');
    console.log('✅ API Response:', response.data);
    
  } catch (error) {
    console.error('❌ API Error:', error.response ? error.response.data : error.message);
  }
}

testAPIDirectly();
