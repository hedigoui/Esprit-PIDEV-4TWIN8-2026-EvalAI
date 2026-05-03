import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginWithVoice from './pages/LoginWithVoice';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import Conversations from './pages/Conversations';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Accessibility Components
import VoiceAssistant from './components/accessibility/VoiceAssistant';
import ReadSelectionComponent from './components/accessibility/ReadSelectionComponent';
import LanguageSwitcher from './components/accessibility/LanguageSwitcher';
import AccessibilityPanel from './components/accessibility/AccessibilityPanel';
import A11yAnnouncer from './components/accessibility/A11yAnnouncer';
import SkipToContent from './components/accessibility/SkipToContent';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentPractice from './pages/student/Practice';
import StudentReports from './pages/student/Reports';
import StudentSettings from './pages/student/Settings';
import Signup from './pages/Signup';
import StudentReclamations from './pages/student/Reclamations';
import StudentOnlineExamRoom from './pages/student/OnlineExamRoom';

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherStudents from './pages/teacher/Students';
import TeacherEvaluate from './pages/teacher/Evaluate';
import TeacherReports from './pages/teacher/Reports';
import TeacherSettings from './pages/teacher/Settings';
import TeacherReclamations from './pages/teacher/Reclamations';
import TeacherOnlineExamRoom from './pages/teacher/OnlineExamRoom';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminSettings from './pages/admin/Settings';
import AdminReclamations from './pages/admin/Reclamations';


import { SocketProvider } from './context/SocketContext';
import ExamInviteNotification from './components/ExamInviteNotification';

function App() {
  return (
    <SocketProvider>
      <Router>
        <SkipToContent />
        <A11yAnnouncer />
        <ExamInviteNotification />
        <LanguageSwitcher />
        <AccessibilityPanel />
        <ReadSelectionComponent />
        <VoiceAssistant />
        <main id="main-content" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Routes>
          <Route path="/" element={<LoginWithVoice />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/messages/:userId" element={<Messages />} />
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/practice" element={<StudentPractice />} />
          <Route path="/student/reports" element={<StudentReports />} />
          <Route path="/student/settings" element={<StudentSettings />} />
          <Route path="/student/reclamations" element={<StudentReclamations />} />
          <Route path="/student/exam-room/:roomId" element={<StudentOnlineExamRoom />} />
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/students" element={<TeacherStudents />} />
          <Route path="/teacher/evaluate" element={<TeacherEvaluate />} />
          <Route path="/teacher/evaluate/:studentId" element={<TeacherEvaluate />} />
          <Route path="/teacher/evaluate/:studentId/:performanceId" element={<TeacherEvaluate />} />
          <Route path="/teacher/exam-room/:roomId" element={<TeacherOnlineExamRoom />} />
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
        </main>
      </Router>
    </SocketProvider>
  );
}
  
  export default App;

