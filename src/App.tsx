import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import BlogPage from './pages/BlogPage'
import Nav from './components/Nav'
import Hero from './components/Hero'
import System from './components/System'
import Expertises from './components/Expertises'
import Method from './components/Method'
import Results from './components/Results'
import CasEtudes from './components/CasEtudes'
import Filter from './components/Filter'
import BlogSection from './components/BlogSection'
import FAQ from './components/FAQ'
import Booking from './components/Booking'

function LandingPage() {
  return (
    <div className="bg-dark-bg text-light font-sans">
      <Nav />
      <main>
        <Hero />
        <System />
        <Method />
        <Results />
        <Expertises />
        <CasEtudes />
        <Filter />
        <BlogSection />
        <FAQ />
        <Booking />
      </main>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
