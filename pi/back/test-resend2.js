const { Resend } = require('resend');

const apiKey = 're_Ndbnsz74_Dsacx2XxjEX894Wm5b5yzZZ3';
const resend = new Resend(apiKey);

async function testResend() {
  console.log('🧪 Testing Resend with onboarding@resend.dev sender...');
  
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',  // Use Resend's test recipient
      subject: 'Test Email',
      html: '<h1>This is a test</h1>',
    });
    
    console.log('Response:', response);
    
    if (response.error) {
      console.error('❌ Error:', response.error);
    } else {
      console.log('✅ Email sent! ID:', response.data?.id);
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

testResend();
