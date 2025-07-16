#!/usr/bin/env node

/**
 * Quick Health Check - One line summary of app status
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_URL || 'https://freefiretournaments.vercel.app';

const quickCheck = async () => {
  try {
    console.log('🔍 Quick health check...');
    
    // Test core endpoints
    const tests = [
      fetch(`${BASE_URL}/api/health-check`),
      fetch(`${BASE_URL}/api/payment-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          userId: 'test',
          userName: 'Test',
          userEmail: 'test@test.com',
          userPhone: '+1234567890',
          purpose: 'test'
        })
      }),
      fetch(`${BASE_URL}/api/check-tournament?all=true`)
    ];
    
    const results = await Promise.all(tests);
    const healthScore = results.filter(r => r.ok).length / results.length * 100;
    
    if (healthScore >= 90) {
      console.log('✅ FreeFire Tournaments API: HEALTHY (Core systems operational)');
    } else if (healthScore >= 70) {
      console.log('⚠️  FreeFire Tournaments API: DEGRADED (Some issues detected)');
    } else {
      console.log('❌ FreeFire Tournaments API: CRITICAL (Major issues detected)');
    }
    
    console.log(`📊 Health Score: ${healthScore.toFixed(0)}% | Run 'node final-api-test.js' for detailed report`);
    
  } catch (error) {
    console.log('❌ FreeFire Tournaments API: ERROR (Cannot connect to server)');
    console.log(`🔧 Error: ${error.message}`);
  }
};

quickCheck();
