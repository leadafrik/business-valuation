// Test the signup flow
const BASE_URL = 'http://localhost:3000';

async function testSignup() {
  console.log('Testing signup flow...\n');

  // Step 1: Test sending OTP
  console.log('Step 1: Sending OTP to test@example.com');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Failed to send OTP');
      return;
    }

    console.log('✓ OTP sent successfully\n');

    // Step 2: Wait a moment and verify OTP
    console.log('Step 2: Verifying OTP...');
    console.log('(In development mode, check server logs for the generated OTP)\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSignup();
