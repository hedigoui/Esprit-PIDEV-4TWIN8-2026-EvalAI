// Simple database test to check what's actually stored
// Run this in browser console when logged in

const testDatabase = async () => {
  console.log('🔍 Testing database connection and data...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found. Please login first.');
    return;
  }

  try {
    // Test 1: Get all users
    console.log('\n📋 Test 1: Getting ALL users...');
    const allUsersResponse = await fetch('http://localhost:3000/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (allUsersResponse.ok) {
      const allUsers = await allUsersResponse.json();
      console.log(`✅ Total users in database: ${allUsers.data?.length || 0}`);
      console.log('📊 All users:', allUsers.data?.map(u => ({
        id: u._id,
        email: u.email,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName
      })));
    } else {
      console.log('❌ Failed to get all users');
    }

    // Test 2: Get only students  
    console.log('\n📋 Test 2: Getting STUDENTS only...');
    const studentsResponse = await fetch('http://localhost:3000/users/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (studentsResponse.ok) {
      const students = await studentsResponse.json();
      console.log(`✅ Students endpoint returned: ${students.data?.length || 0}`);
      console.log('📊 Students:', students.data?.map(s => ({
        id: s._id,
        email: s.email,
        role: s.role,
        firstName: s.firstName,
        lastName: s.lastName
      })));
    } else {
      console.log('❌ Failed to get students');
    }

    // Test 3: Try to create a simple student
    console.log('\n📋 Test 3: Creating test student...');
    const createResponse = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: 'test@student.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      })
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Test student created:', created);
    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create test student:', error);
    }

  } catch (error) {
    console.error('❌ Database test failed:', error);
  }

  console.log('\n🎉 Database test complete!');
  console.log('📋 Summary:');
  console.log('- Check if users are being created with correct roles');
  console.log('- Check if database connection is working');
  console.log('- Check if API endpoints are responding');
};

// Run the test
testDatabase();
