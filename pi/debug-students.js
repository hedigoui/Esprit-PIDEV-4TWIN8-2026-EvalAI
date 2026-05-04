// Quick test to debug the students issue
// Run this in browser console when logged in as instructor

const debugStudents = async () => {
  console.log('🔍 Debugging students issue...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ No token found. Please login first.');
    return;
  }

  try {
    // Test 1: Get all users to see what's actually in database
    console.log('\n📋 Test 1: Getting ALL users...');
    const allUsersResponse = await fetch('http://localhost:3000/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (allUsersResponse.ok) {
      const allUsers = await allUsersResponse.json();
      console.log(`✅ Total users in database: ${allUsers.data?.length || 0}`);
      
      // Group users by role
      const usersByRole = {};
      allUsers.data?.forEach(user => {
        const role = user.role || 'undefined';
        if (!usersByRole[role]) usersByRole[role] = [];
        usersByRole[role].push({
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
      });
      
      console.log('📊 Users by role:', usersByRole);
      
      // Check if any users have 'student' role
      if (usersByRole['student']) {
        console.log(`✅ Found ${usersByRole['student'].length} users with 'student' role`);
      } else {
        console.log('❌ No users found with "student" role');
        console.log('🔍 Available roles:', Object.keys(usersByRole));
      }
    } else {
      console.log('❌ Failed to get all users:', allUsersResponse.status);
    }

    // Test 2: Get only students endpoint
    console.log('\n📋 Test 2: Getting students from /users/students endpoint...');
    const studentsResponse = await fetch('http://localhost:3000/users/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (studentsResponse.ok) {
      const students = await studentsResponse.json();
      console.log(`✅ Students endpoint returned: ${students.data?.length || 0} students`);
      console.log('📊 Students data:', students.data);
    } else {
      console.log('❌ Failed to get students:', studentsResponse.status);
      const errorText = await studentsResponse.text();
      console.log('❌ Error details:', errorText);
    }

    // Test 3: Create a test student if needed
    console.log('\n📋 Test 3: Creating a test student...');
    const createResponse = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email: `test-student-${Date.now()}@test.com`,
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student'
      })
    });

    if (createResponse.ok) {
      const created = await createResponse.json();
      console.log('✅ Test student created:', created.data);
    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create test student:', error);
    }

  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }

  console.log('\n🎉 Debug complete!');
  console.log('📋 Check the backend console for detailed debugging output');
};

// Run the debug
debugStudents();
