// Simple script to create test students
// Run this in browser console when logged in as admin

const createTestStudents = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('❌ Please login as admin first');
    return;
  }

  const testStudents = [
    {
      email: 'student1@test.com',
      password: 'password123',
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'student',
      level: 'B1',
      status: 'Active'
    },
    {
      email: 'student2@test.com',
      password: 'password123',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'student',
      level: 'B2',
      status: 'Active'
    },
    {
      email: 'student3@test.com',
      password: 'password123',
      firstName: 'Charlie',
      lastName: 'Brown',
      role: 'student',
      level: 'A2',
      status: 'Active'
    }
  ];

  console.log('🚀 Creating test students...');

  for (const student of testStudents) {
    try {
      const response = await fetch('http://localhost:3000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(student)
      });

      if (response.ok) {
        console.log(`✅ Created: ${student.firstName} ${student.lastName}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to create ${student.firstName}: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${student.firstName}:`, error);
    }
  }

  console.log('🎉 Test students creation complete!');
  console.log('📋 Now refresh teacher students page to see them');
};

// Run the function
createTestStudents();
