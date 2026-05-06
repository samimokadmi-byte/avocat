import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ScrollToTop from './utils/ScrollToTop'

// ── Landing page sections (loaded eagerly — visible on first paint) ──────────
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

// ── Heavy routes — loaded only when the user navigates to them ───────────────
// Each lazy() call becomes a separate JS chunk in the build output.
const LoginPage    = lazy(() => import('./pages/LoginPage'))
const SignupPage   = lazy(() => import('./pages/SignupPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AdminPage    = lazy(() => import('./pages/AdminPage'))
const BlogPage     = lazy(() => import('./pages/BlogPage'))

// ── Minimal suspense fallback (avoids layout shift) ──────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  )
}

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
    <>
      {/* Resets scroll position on every route change (except in-page anchors) */}
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"        element={<LandingPage />} />
          <Route path="/blog"    element={<BlogPage />} />
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/signup"  element={<SignupPage />} />
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
          {/* Catch-all: redirect unknown hashes to home instead of blank screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
