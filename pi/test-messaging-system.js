// Test the complete messaging system
// Run this in browser console when logged in as teacher

const testMessagingSystem = async () => {
  console.log('🧪 Testing complete messaging system...');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  console.log('👤 Current user:', user);
  console.log('🔑 Token exists:', !!token);

  if (!token) {
    console.log('❌ Please login first');
    return;
  }

  try {
    // Test 1: Check if students exist
    console.log('\n📋 Test 1: Checking students...');
    const studentsResponse = await fetch('http://localhost:3000/users/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (studentsResponse.ok) {
      const studentsData = await studentsResponse.json();
      console.log(`✅ Found ${studentsData.data?.length || 0} students`);
      
      if (studentsData.data?.length > 0) {
        const firstStudent = studentsData.data[0];
        console.log(`🎯 Testing with student: ${firstStudent.firstName} ${firstStudent.lastName}`);
        
        // Test 2: Send message to first student
        console.log('\n💬 Test 2: Sending message...');
        const messageResponse = await fetch('http://localhost:3000/communication/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            receiverId: firstStudent.id,
            content: 'Hello! This is a test message from teacher to student.',
            type: 'text'
          })
        });

        if (messageResponse.ok) {
          console.log('✅ Message sent successfully!');
          const messageData = await messageResponse.json();
          console.log('📨 Message response:', messageData);
        } else {
          const error = await messageResponse.text();
          console.log('❌ Failed to send message:', error);
        }

        // Test 3: Check conversations
        console.log('\n📋 Test 3: Checking conversations...');
        const conversationsResponse = await fetch('http://localhost:3000/communication/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (conversationsResponse.ok) {
          const conversationsData = await conversationsResponse.json();
          console.log(`✅ Found ${conversationsData.data?.length || 0} conversations`);
          console.log('📨 Conversations:', conversationsData.data);
        } else {
          const error = await conversationsResponse.text();
          console.log('❌ Failed to load conversations:', error);
        }
      } else {
        console.log('⚠️ No students found to test messaging with');
        console.log('💡 Run the add-students.js script first to create test students');
      }
    } else {
      console.log('❌ Failed to load students:', studentsResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n🎉 Test complete!');
  console.log('📋 Summary:');
  console.log('- Students API: Working if students loaded');
  console.log('- Messaging API: Working if message sent');
  console.log('- Conversations API: Working if conversations loaded');
};

// Run the test
testMessagingSystem();
