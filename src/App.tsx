import { Routes, Route, Navigate } from "react-router-dom"
import GuestLayout from "@/layouts/GuestLayout"
import DashboardLayout from "@/layouts/DashboardLayout"
import Dashboard from "@/pages/Dashboard"

// Lazy load pages later, for now direct import or placeholders
function Login() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Welcome Back!</h2>
      <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:translate-y-[2px] active:shadow-none">
        Login with Email
      </button>
    </div>
  )
}

function Register() {
  return <div>Register Page</div>
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<GuestLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

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
