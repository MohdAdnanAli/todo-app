/**
 * SMTP Test Script
 * 
 * Run this script to test SMTP configuration from .env variables:
 *   npx tsx test-smtp.ts
 *   # or
 *   bun run test-smtp.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { getSMTPConfig, isSMTPConfigured, testSMTPConnection, sendEmail } from './utils/smtp';

async function main() {
  console.log('\n=== SMTP Configuration Test ===\n');

  // Step 1: Check if SMTP is configured
  console.log('1. Checking SMTP configuration...');
  const isConfigured = isSMTPConfigured();
  console.log(`   SMTP Configured: ${isConfigured ? 'YES ✅' : 'NO ❌'}`);

  if (!isConfigured) {
    console.log('\n⚠️  SMTP is not configured. Please set the following environment variables:');
    console.log('   - SMTP_HOST');
    console.log('   - SMTP_PORT');
    console.log('   - SMTP_USER');
    console.log('   - SMTP_PASS');
    console.log('   - SMTP_FROM (optional)');
    console.log('   - SMTP_SECURE (optional, true/false)\n');
    process.exit(1);
  }

  // Step 2: Display SMTP configuration (without sensitive data)
  console.log('\n2. SMTP Configuration:');
  const config = getSMTPConfig();
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  console.log(`   From: ${config.from}`);
  console.log(`   User: ${config.user ? '✓ Set' : '✗ Not set'}`);
  console.log(`   Pass: ${config.pass ? '✓ Set' : '✗ Not set'}`);

  // Step 3: Test SMTP connection
  console.log('\n3. Testing SMTP connection...');
  console.log('   (This may take a few seconds...)\n');
  
  const result = await testSMTPConnection();
  
  if (result.success) {
    console.log('✅ SMTP Connection Test: PASSED');
    console.log(`   Message: ${result.message}`);
  } else {
    console.log('❌ SMTP Connection Test: FAILED');
    console.log(`   Error: ${result.message}`);
    process.exit(1);
  }

  // Step 4: Optional - Send test email
  const testEmail = process.env.TEST_EMAIL;
  if (testEmail) {
    console.log(`\n4. Sending test email to: ${testEmail}`);
    const emailResult = await sendEmail({
      to: testEmail,
      subject: 'SMTP Test Email',
      html: `
        <h1>SMTP Test Successful!</h1>
        <p>This is a test email from your Todo App SMTP configuration.</p>
        <p>Configuration:</p>
        <ul>
          <li>Host: ${config.host}</li>
          <li>Port: ${config.port}</li>
          <li>Secure: ${config.secure}</li>
        </ul>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
      text: `SMTP Test Successful! This is a test email from your Todo App.`
    });

    if (emailResult) {
      console.log('✅ Test email sent successfully!');
    } else {
      console.log('❌ Failed to send test email');
      process.exit(1);
    }
  } else {
    console.log('\n4. Skip: TEST_EMAIL not set in environment');
    console.log('   To send a test email, set TEST_EMAIL=your@email.com');
  }

  console.log('\n=== All SMTP Tests Passed! ✅ ===\n');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

