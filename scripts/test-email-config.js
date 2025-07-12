import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

async function testEmailConfig() {
  console.log('===== EMAIL CONFIGURATION TEST =====');
  console.log('Environment variables:');
  console.log(`WITHDRAWAL_EMAIL_USER: ${process.env.WITHDRAWAL_EMAIL_USER || 'NOT SET'}`);
  console.log(`WITHDRAWAL_EMAIL_PASSWORD length: ${process.env.WITHDRAWAL_EMAIL_PASSWORD ? process.env.WITHDRAWAL_EMAIL_PASSWORD.length : 'NOT SET'}`);
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`);
  console.log(`EMAIL_PASSWORD length: ${process.env.EMAIL_PASSWORD ? process.env.EMAIL_PASSWORD.length : 'NOT SET'}`);
  
  // Try to create a transporter with the withdrawal email credentials
  try {
    console.log('\nCreating transporter with WITHDRAWAL_EMAIL_USER...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.WITHDRAWAL_EMAIL_USER,
        pass: process.env.WITHDRAWAL_EMAIL_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful with WITHDRAWAL_EMAIL_USER!');
  } catch (error) {
    console.error('❌ Connection failed with WITHDRAWAL_EMAIL_USER:', error.message);
  }
  
  // Try to create a transporter with the regular email credentials as fallback
  try {
    console.log('\nCreating transporter with EMAIL_USER as fallback...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });
    
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection successful with EMAIL_USER!');
  } catch (error) {
    console.error('❌ Connection failed with EMAIL_USER:', error.message);
  }
}

testEmailConfig().catch(console.error); 