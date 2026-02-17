import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import AdminLayout from "@/layouts/AdminLayout"
import StudentLayout from "@/layouts/StudentLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import TeacherManagement from "@/pages/admin/TeacherManagement"
import StudentManagement from "@/pages/admin/StudentManagement"
import SubjectManagement from "@/pages/admin/SubjectManagement"
import AcademicYearManagement from "@/pages/admin/AcademicYearManagement"
import StudentDashboard from "@/pages/student/StudentDashboard"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"

// Guard for protected routes
function RequireAuth() {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>; // Or a proper spinner component based on your UI library
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Route that decides which layout to show based on role
function RoleBasedDashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'teacher') {
    return <AdminLayout />;
  }

  return <StudentLayout />;
}

// Component to decide which dashboard page to show inside the layout
function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'teacher') {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          {/* Root Path - Automatically renders correct layout & dashboard based on role */}
          <Route path="/" element={<RoleBasedDashboard />}>
            <Route index element={<DashboardPage />} />

            {/* Common sub-routes (can be conditionally rendered or protected inside components) */}
            <Route path="courses" element={<div>Courses Page</div>} />
            <Route path="users" element={<div>Users Page</div>} />
            <Route path="admin/teachers" element={<TeacherManagement />} />
            <Route path="admin/students" element={<StudentManagement />} />
            <Route path="admin/subjects" element={<SubjectManagement />} />
            <Route path="admin/academic-years" element={<AcademicYearManagement />} />
            <Route path="exams" element={<div>Exams Page</div>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
