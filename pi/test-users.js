// Test Users Setup Script
// Run this in your browser console when logged in as admin or directly in MongoDB

const testUsers = [
  {
    email: 'teacher@test.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Smith',
    role: 'instructor'
  },
  {
    email: 'student@test.com', 
    password: 'password123',
    firstName: 'Sarah',
    lastName: 'Miller',
    role: 'student'
  }
];

// Instructions:
// 1. Create these users through signup page
// 2. Login as teacher first
// 3. Then login as student
// 4. Test messaging between them
