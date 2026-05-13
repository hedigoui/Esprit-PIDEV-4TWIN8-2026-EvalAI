const { Resend } = require('resend');

const apiKey = 're_Ndbnsz74_Dsacx2XxjEX894Wm5b5yzZZ3';
const resend = new Resend(apiKey);

async function testResend() {
  console.log('🧪 Testing Resend API Key...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',  // Use Resend's default verified domain
      to: 'fatnassiahmed310@gmail.com',
      subject: 'Test Email from Resend',
      html: '<h1>This is a test email</h1><p>If you see this, Resend is working!</p>',
    });
    
    console.log('✅ Response:', response);
    
    if (response.error) {
      console.error('❌ API Error:', response.error);
    } else if (response.data?.id) {
      console.log('✅ Email sent successfully! ID:', response.data.id);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testResend();
