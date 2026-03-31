import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentPractice from './pages/student/Practice';
import StudentReports from './pages/student/Reports';
import StudentSettings from './pages/student/Settings';
import Signup from './pages/Signup';
// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherEvaluate from './pages/teacher/Evaluate';
import TeacherReports from './pages/teacher/Reports';
import TeacherSettings from './pages/teacher/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminReclamations from './pages/admin/Reclamations';
import StudentReclamations from './pages/student/Reclamations';
import TeacherReclamations from './pages/teacher/Reclamations';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/practice" element={<StudentPractice />} />
        <Route path="/student/reports" element={<StudentReports />} />
        <Route path="/student/settings" element={<StudentSettings />} />
        <Route path="/student/reclamations" element={<StudentReclamations />} />
        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/students" element={<TeacherStudents />} />
        <Route path="/teacher/evaluate" element={<TeacherEvaluate />} />
        <Route path="/teacher/evaluate/:studentId" element={<TeacherEvaluate />} />
        <Route path="/teacher/reports" element={<TeacherReports />} />
        <Route path="/teacher/settings" element={<TeacherSettings />} />
        <Route path="/teacher/reclamations" element={<TeacherReclamations />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/reclamations" element={<AdminReclamations />} />
      </Routes>
    </Router>
  );
}

export default App;

