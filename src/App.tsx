import { Routes, Route, Navigate } from "react-router-dom"
import DashboardLayout from "@/layouts/DashboardLayout"
import Dashboard from "@/pages/Dashboard"
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"

function App() {
  return (
    <Routes>
      {/* Public Routes - AuthLayout is handled within the pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Redirect root to login for now */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes (TODO: Wrap in AuthGuard) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="learn" element={<div>My Courses</div>} />
        <Route path="leaderboard" element={<div>Leaderboard</div>} />
      </Route>
    </Routes>
  )
}

export default App
